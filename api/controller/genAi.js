import supabase from "../config/supabaseConfig.js";
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
    .select("role, message")
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

// ── Main controller ───────────────────────────────────────────
export const morningCheckin = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split("T")[0];

    if (!message) return res.status(400).json({ error: "Message is required" });

    // get user info
    const { data: user } = await supabase
      .from("users")
      .select("name, city, area")
      .eq("id", userId)
      .single();

    // check if already checked in today
    const { data: existingCheckin } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", userId)
      .eq("checkin_date", today)
      .single();

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
        - Keep it short (2-3 sentences max)`;

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
    const [mood, events] = await Promise.all([
      detectMood(message),
      extractEvents(message),
    ]);

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

    if (checkinError)
      return res.status(500).json({ error: checkinError.message });

    // save events and schedule follow-ups
    if (events.length > 0) {
      for (const event of events) {
        const eventTime = new Date(event.time);
        const followUpAt = new Date(eventTime.getTime() + 2 * 60 * 60 * 1000);

        const { data: savedEvent } = await supabase
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

        await supabase.from("scheduled_messages").insert({
          user_id: userId,
          event_id: savedEvent.id,
          scheduled_for: followUpAt.toISOString(),
          message_type: "event_followup",
        });
      }
    }

    // schedule evening and night check-ins
    const eveningTime = new Date();
    eveningTime.setHours(19, 0, 0, 0);
    const nightTime = new Date();
    nightTime.setHours(22, 0, 0, 0);

    await supabase.from("scheduled_messages").insert([
      {
        user_id: userId,
        scheduled_for: eveningTime.toISOString(),
        message_type: "evening_checkin",
      },
      {
        user_id: userId,
        scheduled_for: nightTime.toISOString(),
        message_type: "night_checkin",
      },
    ]);

    // save user message first so it's included in history
    await supabase.from("conversations").insert({
      user_id: userId,
      checkin_id: checkin.id,
      role: "user",
      message,
      message_type: "morning",
    });

    // fetch history (just this first message)
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
      - End with something encouraging for their day`;

    const aiResponse = await llm.invoke(
      buildMessages(systemPrompt, history, message),
    );

    // save AI response
    await supabase.from("conversations").insert({
      user_id: userId,
      checkin_id: checkin.id,
      role: "assistant",
      message: aiResponse.content,
      message_type: "morning",
    });

    res.json({
      reply: aiResponse.content,
      checkin_id: checkin.id,
      mood,
      events_detected: events.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
