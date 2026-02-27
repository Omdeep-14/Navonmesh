import supabase from "../config/supabaseConfig.js";
import { handleNightRecommendation } from "../controller/recommender.js";
import { ChatGroq } from "@langchain/groq";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  temperature: 0.8,
});

// ── Fetch today's conversation history from DB ────────────────
const getConversationHistory = async (userId, checkinId) => {
  const { data } = await supabase
    .from("conversations")
    .select("role, message, message_type")
    .eq("user_id", userId)
    .eq("checkin_id", checkinId)
    .order("created_at", { ascending: true });

  return data || [];
};

// ── Build LangChain message array from history ────────────────
const buildMessages = (systemPrompt, history, currentMessage) => {
  const messages = [new SystemMessage(systemPrompt)];

  history.forEach((msg) => {
    if (msg.role === "user") {
      messages.push(new HumanMessage(msg.message));
    } else {
      messages.push(new AIMessage(msg.message));
    }
  });

  messages.push(new HumanMessage(currentMessage));
  return messages;
};

// ── Extract events from message ───────────────────────────────
const extractEvents = async (message) => {
  const response = await llm.invoke([
    new SystemMessage(`You are a helper that extracts scheduled events from a message.
      Return ONLY a JSON array of events found, like:
      [{ "title": "meeting with manager", "time": "2025-02-27T12:00:00" }]
      If no events found, return [].
      Use today's date for relative times like "at 2pm today".
      Today is ${new Date().toISOString()}`),
    new HumanMessage(message),
  ]);

  try {
    const cleaned = response.content.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
};

// ── Detect mood ───────────────────────────────────────────────
const detectMood = async (message) => {
  const response = await llm.invoke([
    new SystemMessage(`You are a mood detector. Given a message, return ONLY a JSON object like:
      { "mood_label": "anxious", "mood_score": 4 }
      mood_label must be one of: happy, okay, anxious, sad, stressed, angry
      mood_score is 1-10 where 1=terrible, 10=great`),
    new HumanMessage(message),
  ]);

  try {
    const cleaned = response.content.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { mood_label: "okay", mood_score: 5 };
  }
};

// ── Check if night recommendation should trigger ──────────────
const shouldTriggerRecommendation = (history) => {
  const hasNightCheckin = history.some(
    (m) => m.message_type === "night_checkin",
  );
  if (!hasNightCheckin) return false;

  const alreadySent = history.some(
    (m) => m.message_type === "night_recommendation",
  );
  if (alreadySent) return false;

  const nightCheckinIndex = history.findLastIndex(
    (m) => m.message_type === "night_checkin",
  );
  const messagesAfterNight = history
    .slice(nightCheckinIndex + 1)
    .filter((m) => m.role === "user");

  return messagesAfterNight.length >= 2;
};

// ── Safe schedule insert with full logging ────────────────────
const insertScheduledMessage = async (payload) => {
  console.log("Inserting scheduled_message:", JSON.stringify(payload));
  const { data, error } = await supabase
    .from("scheduled_messages")
    .insert(payload)
    .select();
  if (error) {
    console.error("scheduled_messages insert FAILED:", JSON.stringify(error));
  } else {
    console.log(
      "✓ scheduled_messages inserted:",
      data?.map((r) => r.id),
    );
  }
  return { data, error };
};

// ── Main controller ───────────────────────────────────────────
export const morningCheckin = async (req, res) => {
  try {
    console.log("=== morningCheckin called ===");

    const { message } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split("T")[0];
    const isFast = req.query.fast === "true";

    console.log("userId:", userId);
    console.log("isFast:", isFast);
    console.log("today:", today);

    if (!message) return res.status(400).json({ error: "Message is required" });

    // get user info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("name, email, age, city, area")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error("User fetch error:", userError);
      return res.status(500).json({ error: "Could not fetch user" });
    }

    console.log("User fetched:", user.name);

    // check if already checked in today
    const { data: existingCheckin } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", userId)
      .eq("checkin_date", today)
      .single();

    console.log(
      "existingCheckin:",
      existingCheckin?.id || "none — first checkin of the day",
    );

    // ── Already checked in — continue conversation with memory ──
    if (existingCheckin) {
      const history = await getConversationHistory(userId, existingCheckin.id);

      const systemPrompt = `You are a warm, empathetic mental health companion — like a close friend, not a therapist.
        The user's name is ${user.name}.
        They checked in this morning feeling ${existingCheckin.mood_label} (${existingCheckin.mood_score}/10).
        You have been talking with them today and remember everything said in this conversation.
        Guidelines:
        - Be warm, human, and conversational — not clinical
        - Never mention check-ins, sessions, or anything technical
        - Reference what they said earlier if it is relevant — show you were listening
        - If they seem to be getting more distressed, be extra gentle
        - Keep it short (2-3 sentences max)
        - Never say "I'm here for you", "you're not alone", "safe space"
        - Sound like a real friend, not a wellness app`;

      const aiResponse = await llm.invoke(
        buildMessages(systemPrompt, history, message),
      );

      await supabase.from("conversations").insert([
        {
          user_id: userId,
          checkin_id: existingCheckin.id,
          role: "user",
          message,
          message_type: "morning",
        },
        {
          user_id: userId,
          checkin_id: existingCheckin.id,
          role: "assistant",
          message: aiResponse.content,
          message_type: "morning",
        },
      ]);

      // ── Check if night recommendation should fire ──
      const updatedHistory = await getConversationHistory(
        userId,
        existingCheckin.id,
      );
      if (shouldTriggerRecommendation(updatedHistory)) {
        console.log("Triggering night recommendation...");
        handleNightRecommendation(
          userId,
          existingCheckin.id,
          updatedHistory,
          user,
          existingCheckin,
        ).catch((err) => console.error("Recommendation error:", err.message));
      }

      return res.json({
        reply: aiResponse.content,
        checkin_id: existingCheckin.id,
        mood: {
          mood_label: existingCheckin.mood_label,
          mood_score: existingCheckin.mood_score,
        },
        events_detected: 0,
      });
    }

    // ── First checkin of the day ──
    console.log("Running mood detection and event extraction...");

    const [mood, events] = await Promise.all([
      detectMood(message),
      extractEvents(message),
    ]);

    console.log("Mood detected:", mood);
    console.log("Events detected:", events.length);

    const { data: checkin, error: checkinError } = await supabase
      .from("daily_checkins")
      .insert({
        user_id: userId,
        checkin_date: today,
        mood_score: mood.mood_score,
        mood_label: mood.mood_label,
        raw_message: message,
      })
      .select()
      .single();

    if (checkinError) {
      console.error("Checkin insert error:", JSON.stringify(checkinError));
      return res.status(500).json({ error: checkinError.message });
    }

    console.log("✓ Checkin created:", checkin.id);

    // save events and schedule follow-ups
    if (events.length > 0) {
      for (const event of events) {
        const eventTime = new Date(event.time);

        const followUpAt = isFast
          ? new Date(Date.now() + 30 * 1000)
          : new Date(eventTime.getTime() + 2 * 60 * 60 * 1000);

        const { data: savedEvent, error: eventError } = await supabase
          .from("user_events")
          .insert({
            user_id: userId,
            checkin_id: checkin.id,
            event_title: event.title,
            event_time: eventTime.toISOString(),
            follow_up_at: followUpAt.toISOString(),
          })
          .select()
          .single();

        if (eventError) {
          console.error(
            "user_events insert error:",
            JSON.stringify(eventError),
          );
          continue;
        }

        console.log("✓ Event saved:", savedEvent.id);

        await insertScheduledMessage({
          user_id: userId,
          event_id: savedEvent.id,
          scheduled_for: followUpAt.toISOString(),
          message_type: "event_followup",
        });
      }
    }

    // calculate evening and night times
    const eveningTime = new Date();
    eveningTime.setTime(
      isFast
        ? Date.now() + 60 * 1000
        : (() => {
            const t = new Date();
            t.setHours(19, 0, 0, 0);
            return t;
          })().getTime(),
    );

    const nightTime = new Date();
    nightTime.setTime(
      isFast
        ? Date.now() + 110 * 1000
        : (() => {
            const t = new Date();
            t.setHours(22, 0, 0, 0);
            return t;
          })().getTime(),
    );

    console.log("Evening scheduled for:", eveningTime.toISOString());
    console.log("Night scheduled for:", nightTime.toISOString());

    // insert evening checkin
    await insertScheduledMessage({
      user_id: userId,
      scheduled_for: eveningTime.toISOString(),
      message_type: "evening_checkin",
    });

    // insert night checkin
    await insertScheduledMessage({
      user_id: userId,
      scheduled_for: nightTime.toISOString(),
      message_type: "night_checkin",
    });

    // save user message
    const { error: convError } = await supabase.from("conversations").insert({
      user_id: userId,
      checkin_id: checkin.id,
      role: "user",
      message,
      message_type: "morning",
    });

    if (convError)
      console.error("Conversation insert error:", JSON.stringify(convError));

    const history = await getConversationHistory(userId, checkin.id);

    const systemPrompt = `You are a warm, empathetic mental health companion — like a close friend, not a therapist.
      The user's name is ${user.name}.
      Today they checked in feeling ${mood.mood_label} (${mood.mood_score}/10).
      ${events.length > 0 ? `They have these events today: ${events.map((e) => e.title).join(", ")}` : ""}
      Guidelines:
      - Be warm, human, and conversational — not clinical
      - Acknowledge their feelings genuinely
      - If they have events, gently reassure them
      - Keep it short (3-4 sentences max)
      - Don't use bullet points or lists
      - End with something encouraging for their day
      - Never say "I'm here for you", "you're not alone", "safe space"
      - Sound like a real friend, not a wellness app`;

    const aiResponse = await llm.invoke(
      buildMessages(systemPrompt, history, message),
    );

    await supabase.from("conversations").insert({
      user_id: userId,
      checkin_id: checkin.id,
      role: "assistant",
      message: aiResponse.content,
      message_type: "morning",
    });

    console.log("=== morningCheckin complete ===");

    res.json({
      reply: aiResponse.content,
      checkin_id: checkin.id,
      mood,
      events_detected: events.length,
    });
  } catch (err) {
    console.error("morningCheckin CRASH:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── Poll for new proactive messages ──────────────────────────
export const pollMessages = async (req, res) => {
  const userId = req.user.id;
  const { date } = req.query;

  const { data: checkin } = await supabase
    .from("daily_checkins")
    .select("id")
    .eq("user_id", userId)
    .eq("checkin_date", date)
    .single();

  if (!checkin) return res.json({ newMessages: [] });

  const since = new Date(Date.now() - 35_000).toISOString();

  const { data: newMessages } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("checkin_id", checkin.id)
    .eq("role", "assistant")
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  res.json({ newMessages: newMessages || [] });
};
