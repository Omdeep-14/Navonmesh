import cron from "node-cron";
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

const getConversationHistory = async (userId, checkinId) => {
  const { data } = await supabase
    .from("conversations")
    .select("role, message")
    .eq("user_id", userId)
    .eq("checkin_id", checkinId)
    .order("created_at", { ascending: true });
  return data || [];
};

const generateProactiveMessage = async (type, user, checkin, history) => {
  const prompts = {
    event_followup: `You are a warm mental health companion like a close friend.
      The user's name is ${user.name}.
      Earlier today they mentioned an event and seemed worried about it.
      You are proactively checking in to see how it went.
      Look at the conversation history to know what event they mentioned.
      Write a short, warm, natural follow-up (1-2 sentences).
      Don't say "I'm checking in" — just ask naturally like a friend would.`,

    evening_checkin: `You are a warm mental health companion like a close friend.
      The user's name is ${user.name}.
      They checked in this morning feeling ${checkin.mood_label}.
      It's evening now. Reach out warmly to see how their day went.
      Write a short, natural message (1-2 sentences).
      Reference their morning mood naturally — don't be clinical.`,

    night_checkin: `You are a warm mental health companion like a close friend.
      The user's name is ${user.name}.
      It's nighttime. They started the day feeling ${checkin.mood_label}.
      Check in gently for the night. Be cozy and warm.
      Write a short, caring message (1-2 sentences).`,
  };

  const systemPrompt = prompts[type] || prompts.evening_checkin;
  const messages = [new SystemMessage(systemPrompt)];

  history.forEach((msg) => {
    messages.push(
      msg.role === "user"
        ? new HumanMessage(msg.message)
        : new AIMessage(msg.message),
    );
  });

  const response = await llm.invoke(messages);
  return response.content;
};

const processScheduledMessages = async () => {
  const now = new Date().toISOString();

  // fetch all pending messages that are due
  const { data: dueMessages, error } = await supabase
    .from("scheduled_messages")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now);

  if (error || !dueMessages?.length) return;

  console.log(`Processing ${dueMessages.length} scheduled message(s)...`);

  for (const scheduledMsg of dueMessages) {
    try {
      // get user info
      const { data: user } = await supabase
        .from("users")
        .select("name, city, area")
        .eq("id", scheduledMsg.user_id)
        .single();

      // get today's checkin
      const today = new Date().toISOString().split("T")[0];
      const { data: checkin } = await supabase
        .from("daily_checkins")
        .select("*")
        .eq("user_id", scheduledMsg.user_id)
        .eq("checkin_date", today)
        .single();

      if (!checkin) {
        // no checkin today, skip
        await supabase
          .from("scheduled_messages")
          .update({ status: "skipped" })
          .eq("id", scheduledMsg.id);
        continue;
      }

      // get conversation history
      const history = await getConversationHistory(
        scheduledMsg.user_id,
        checkin.id,
      );

      // generate the proactive message
      const messageText = await generateProactiveMessage(
        scheduledMsg.message_type,
        user,
        checkin,
        history,
      );

      // save to conversations so it appears in chat
      await supabase.from("conversations").insert({
        user_id: scheduledMsg.user_id,
        checkin_id: checkin.id,
        role: "assistant",
        message: messageText,
        message_type: scheduledMsg.message_type,
      });

      // mark as sent
      await supabase
        .from("scheduled_messages")
        .update({ status: "sent" })
        .eq("id", scheduledMsg.id);

      console.log(`✓ Sent ${scheduledMsg.message_type} to user ${user.name}`);
    } catch (err) {
      console.error(
        `Failed to process message ${scheduledMsg.id}:`,
        err.message,
      );
    }
  }
};

// run every minute
export const startScheduler = () => {
  cron.schedule("* * * * *", processScheduledMessages);
  console.log("Message scheduler started ✓");
};
