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

// helper to extract event details from message using AI
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

// helper to detect mood
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

export const morningCheckin = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split("T")[0];

    if (!message) return res.status(400).json({ error: "Message is required" });

    // check if already checked in today
    const { data: existingCheckin } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", userId)
      .eq("checkin_date", today)
      .single();

    if (existingCheckin) {
      return res.status(400).json({ error: "Already checked in today" });
    }

    // get user info for personalization
    const { data: user } = await supabase
      .from("users")
      .select("name, city, area")
      .eq("id", userId)
      .single();

    // detect mood and extract events in parallel
    const [mood, events] = await Promise.all([
      detectMood(message),
      extractEvents(message),
    ]);

    // save checkin
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
        const followUpAt = new Date(eventTime.getTime() + 2 * 60 * 60 * 1000); // +2 hours

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

        // schedule event follow-up message
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

    // save user message to conversations
    await supabase.from("conversations").insert({
      user_id: userId,
      checkin_id: checkin.id,
      role: "user",
      message: message,
      message_type: "morning",
    });

    // generate AI response
    const aiResponse = await llm.invoke([
      new SystemMessage(`You are a warm, empathetic mental health companion — like a close friend, not a therapist.
        The user's name is ${user.name}.
        Today they checked in feeling ${mood.mood_label} (${mood.mood_score}/10).
        ${events.length > 0 ? `They have these events today: ${events.map((e) => e.title).join(", ")}` : ""}
        
        Guidelines:
        - Be warm, human, and conversational — not clinical
        - Acknowledge their feelings genuinely
        - If they have events, gently reassure them
        - Keep it short (3-4 sentences max)
        - Don't use bullet points or lists
        - End with something encouraging for their day`),
      new HumanMessage(message),
    ]);

    // save AI response to conversations
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
