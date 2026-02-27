import supabase from "../config/supabaseConfig.js";
import { handleNightRecommendation } from "../controller/recommender.js";
import sendMail from "../config/nodemailer.js";
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

const LOW_MOOD_LABELS = ["sad", "anxious", "stressed", "angry", "depressed"];
const HELPLINES = [
  { name: "iCall", number: "9152987821", hours: "Mon–Sat, 8am–10pm" },
  { name: "Vandrevala Foundation", number: "1860-2662-345", hours: "24/7" },
];

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
    messages.push(
      msg.role === "user"
        ? new HumanMessage(msg.message)
        : new AIMessage(msg.message),
    );
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

// ── Detect self-harm signals ──────────────────────────────────
const detectSelfHarm = async (message) => {
  const response = await llm.invoke([
    new SystemMessage(`You are a safety detector for a mental health app.
      Analyze the message for ANY signals of self-harm, suicidal ideation, wanting to hurt oneself, or not wanting to live.
      Be sensitive — include indirect signals like "I want to disappear", "nobody would miss me", "I can't take it anymore".
      Return ONLY a JSON object: { "self_harm": true } or { "self_harm": false }
      When in doubt, return true. Do not return anything else.`),
    new HumanMessage(message),
  ]);
  try {
    const cleaned = response.content.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned).self_harm === true;
  } catch {
    return false;
  }
};

// ── Check 2 consecutive low mood days ────────────────────────
const checkConsecutiveLowMood = async (userId) => {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const { data: recentCheckins } = await supabase
    .from("daily_checkins")
    .select("checkin_date, mood_label, mood_score")
    .eq("user_id", userId)
    .gte("checkin_date", twoDaysAgo.toISOString().split("T")[0])
    .order("checkin_date", { ascending: false });

  if (!recentCheckins || recentCheckins.length < 2) return false;

  const lowDays = recentCheckins.filter(
    (c) => LOW_MOOD_LABELS.includes(c.mood_label) && c.mood_score <= 5,
  );
  console.log(`Low mood days in last 2: ${lowDays.length}`);
  return lowDays.length >= 2;
};

// ── Helpline email HTML ───────────────────────────────────────
const buildHelplineEmail = (userName, aiMessage) => {
  const appUrl = process.env.APP_URL || "http://localhost:5173";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Mendi</title>
</head>
<body style="margin:0;padding:0;background:#06090f;font-family:Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#06090f;padding:52px 20px 64px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;width:100%;">
      <tr><td style="padding:0 4px 24px;">
        <span style="font-size:11px;font-weight:800;letter-spacing:4px;text-transform:uppercase;color:#8b5cf6;">MENDI</span>
      </td></tr>
      <tr><td style="background:#0c1220;border-radius:24px;border:1px solid #131c2e;overflow:hidden;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="height:2px;background:linear-gradient(90deg,#8b5cf6,#6366f1,transparent);"></td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:36px 44px 24px;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="vertical-align:top;padding-top:2px;">
                <div style="width:42px;height:42px;background:linear-gradient(135deg,#8b5cf6,#6366f1);border-radius:13px;text-align:center;line-height:42px;font-size:19px;display:inline-block;">💜</div>
              </td>
              <td style="padding-left:14px;vertical-align:top;">
                <p style="margin:0 0 3px;color:#e2e8f0;font-size:17px;font-weight:700;letter-spacing:-0.2px;">we're thinking of you</p>
                <p style="margin:0;color:#334155;font-size:12px;letter-spacing:0.2px;">a note from mendi</p>
              </td>
            </tr></table>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:0 44px;"><div style="height:1px;background:#131c2e;"></div></td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:32px 44px 6px;">
            <p style="margin:0;color:#334155;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;">hey ${userName}</p>
          </td></tr>
          <tr><td style="padding:12px 44px 28px;">
            <p style="margin:0;color:#94a3b8;font-size:16px;line-height:1.9;">${aiMessage}</p>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:0 44px;"><div style="height:1px;background:#131c2e;"></div></td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:28px 44px 8px;">
            <p style="color:#334155;font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;margin:0 0 18px 0;">if you need to talk to someone</p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:12px;width:100%;">
              <tr><td style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);border-radius:12px;padding:14px 20px;">
                <p style="margin:0 0 3px;color:#c4b5fd;font-size:13px;font-weight:700;">iCall</p>
                <p style="margin:0 0 2px;color:#e2e8f0;font-size:18px;font-weight:800;letter-spacing:0.5px;">9152987821</p>
                <p style="margin:0;color:#475569;font-size:11px;">Mon–Sat, 8am–10pm</p>
              </td></tr>
            </table>
            <table cellpadding="0" cellspacing="0" style="width:100%;">
              <tr><td style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:12px;padding:14px 20px;">
                <p style="margin:0 0 3px;color:#a78bfa;font-size:13px;font-weight:700;">Vandrevala Foundation</p>
                <p style="margin:0 0 2px;color:#e2e8f0;font-size:18px;font-weight:800;letter-spacing:0.5px;">1860-2662-345</p>
                <p style="margin:0;color:#475569;font-size:11px;">24/7, free &amp; confidential</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:24px 44px 0;"><div style="height:1px;background:#131c2e;"></div></td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:28px 44px 40px;">
            <a href="${appUrl}/home" style="display:inline-block;color:#c4b5fd;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.3px;border-bottom:1px solid #c4b5fd;padding-bottom:2px;font-family:Helvetica,Arial,sans-serif;">
              open mendi →
            </a>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:24px 4px 0;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><p style="margin:0;color:#1e293b;font-size:11px;">from your friend at mendi 💛</p></td>
          <td align="right"><a href="${appUrl}/home" style="color:#1e293b;font-size:11px;text-decoration:none;">open app</a></td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
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

    if (!message) return res.status(400).json({ error: "Message is required" });

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

    // ── Self-harm detection — runs on EVERY message ───────────
    const isSelfHarm = await detectSelfHarm(message);
    console.log("Self-harm detected:", isSelfHarm);

    if (isSelfHarm) {
      const helplinesText = HELPLINES.map(
        (h) => `${h.name} (${h.number}, ${h.hours})`,
      ).join(" or ");

      const selfHarmPrompt = `You are a warm, caring friend texting ${user.name}.
        They've said something that suggests they might be struggling with thoughts of self-harm or not wanting to be here.
        Your response must:
        - Be genuinely warm and human — not clinical or scripted
        - Acknowledge what they're feeling without minimizing it
        - Gently mention that real support is available: ${helplinesText}
        - Keep it short (3-4 sentences max)
        - Do NOT say "I'm here for you", "you're not alone", "safe space", "it's okay to feel"
        - Sound like a caring friend who's genuinely worried, not a hotline script
        - End by encouraging them to reach out to one of those numbers`;

      const aiResponse = await llm.invoke([new SystemMessage(selfHarmPrompt)]);

      // Save conversation if checkin exists
      const { data: existingCheckin } = await supabase
        .from("daily_checkins")
        .select("id")
        .eq("user_id", userId)
        .eq("checkin_date", today)
        .single();

      if (existingCheckin) {
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
      }

      // Send helpline email async (don't await — don't block response)
      sendMail({
        email: user.email,
        subject: `we're thinking of you 💜`,
        html: buildHelplineEmail(user.name, aiResponse.content),
      }).catch((err) => console.error("Helpline email error:", err.message));

      return res.json({
        reply: aiResponse.content,
        checkin_id: existingCheckin?.id || null,
        mood: { mood_label: "sad", mood_score: 2 },
        events_detected: 0,
        self_harm_detected: true,
      });
    }

    // ── Fetch existing checkin ────────────────────────────────
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

    // ── Already checked in — continue conversation ────────────
    if (existingCheckin) {
      const history = await getConversationHistory(userId, existingCheckin.id);
      const cbtTriggered = await checkConsecutiveLowMood(userId);
      console.log("CBT triggered:", cbtTriggered);

      const systemPrompt = `You are a warm, empathetic mental health companion — like a close friend, not a therapist.
        The user's name is ${user.name}.
        They checked in this morning feeling ${existingCheckin.mood_label} (${existingCheckin.mood_score}/10).
        You have been talking with them today and remember everything said in this conversation.
        ${cbtTriggered ? `IMPORTANT: They've been having a rough few days in a row. Be extra warm. At the end of your message, very naturally mention that you have a short exercise that might help them feel a bit lighter — keep it casual and optional-feeling, like "also, I have this little thing that might help if you want to try it".` : ""}
        Guidelines:
        - Be warm, human, and conversational — not clinical
        - Never mention check-ins, sessions, or anything technical
        - Reference what they said earlier if relevant — show you were listening
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
        cbt_triggered: cbtTriggered,
      });
    }

    // ── First checkin of the day ──────────────────────────────
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

    const cbtTriggered = await checkConsecutiveLowMood(userId);
    console.log("CBT triggered:", cbtTriggered);

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

    await insertScheduledMessage({
      user_id: userId,
      scheduled_for: eveningTime.toISOString(),
      message_type: "evening_checkin",
    });
    await insertScheduledMessage({
      user_id: userId,
      scheduled_for: nightTime.toISOString(),
      message_type: "night_checkin",
    });

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
      ${cbtTriggered ? `IMPORTANT: They've been having a rough few days in a row. Be extra warm. At the end of your message, very naturally mention that you have a short exercise that might help — keep it casual, like "also, I have this little thing that might help if you want to try it".` : ""}
      Guidelines:
      - Be warm, human, and conversational — not clinical
      - Acknowledge their feelings genuinely
      - Keep it short (3-4 sentences max)
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
      cbt_triggered: cbtTriggered,
    });
  } catch (err) {
    console.error("morningCheckin CRASH:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── Poll for new proactive messages ──────────────────────────
export const pollMessages = async (req, res) => {
  const userId = req.user.id;
  const { date, last_seen } = req.query;

  const { data: checkin } = await supabase
    .from("daily_checkins")
    .select("id")
    .eq("user_id", userId)
    .eq("checkin_date", date)
    .single();

  if (!checkin) return res.json({ newMessages: [] });

  // Use last_seen cursor — only return messages strictly AFTER it.
  // Falls back to 30s window if no cursor provided (first poll).
  const since = last_seen
    ? new Date(last_seen).toISOString()
    : new Date(Date.now() - 30_000).toISOString();

  const { data: newMessages } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("checkin_id", checkin.id)
    .eq("role", "assistant")
    .eq("message_type", "morning") // only chat replies — scheduler messages go via email only
    .gt("created_at", since)
    .order("created_at", { ascending: true });

  res.json({ newMessages: newMessages || [] });
};

// ── Get context message for email reply deep link ─────────────
export const getChatContext = async (req, res) => {
  const userId = req.user.id;
  const { checkin_id, type } = req.query;

  if (!checkin_id || !type) return res.json({ message: null });

  const { data, error } = await supabase
    .from("conversations")
    .select("message, created_at")
    .eq("user_id", userId)
    .eq("checkin_id", checkin_id)
    .eq("role", "assistant")
    .eq("message_type", type)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) console.error("getChatContext error:", error.message);
  res.json({ message: data?.[0]?.message || null });
};
