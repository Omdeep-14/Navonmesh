import cron from "node-cron";
import supabase from "../config/supabaseConfig.js";
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
  temperature: 0.9,
});

// ── Fetch conversation history ────────────────────────────────
const getConversationHistory = async (userId, checkinId) => {
  const { data, error } = await supabase
    .from("conversations")
    .select("role, message")
    .eq("user_id", userId)
    .eq("checkin_id", checkinId)
    .order("created_at", { ascending: true });

  if (error) console.error("History fetch error:", error.message);
  console.log(
    `Fetched ${data?.length || 0} history messages for checkin ${checkinId}`,
  );
  return data || [];
};

// ── Tone guide based on age ───────────────────────────────────
const getToneForAge = (age) => {
  if (!age) return "casual and warm";
  if (age <= 15)
    return "very casual, like a supportive older sibling. use simple words, maybe a light emoji or two";
  if (age <= 22)
    return "super casual, like a close college friend. can use slang lightly, keep it real and relatable";
  if (age <= 35)
    return "warm and casual, like a good friend who gets it. no fluff, just genuine";
  if (age <= 55)
    return "warm and grounded, like a thoughtful friend. calm and steady tone";
  return "gentle and warm, like a caring old friend. simple and comforting";
};

// ── Generate proactive AI message ────────────────────────────
const generateProactiveMessage = async (type, user, checkin, history) => {
  const tone = getToneForAge(user.age);
  const location = [user.area, user.city].filter(Boolean).join(", ");

  // pull the first user message (their morning checkin) for context
  const morningMessage = history.find((m) => m.role === "user")?.message || "";

  // pull last few exchanges for tight context
  const recentHistory = history.slice(-6);

  const baseRules = `
You are texting ${user.name} like a real friend — NOT a therapist, NOT an AI assistant.
Tone: ${tone}.
${location ? `They live in ${location} — only mention this if it genuinely flows naturally into the conversation, like 90% of messages should not mention location at all.` : ""}
${user.age ? `They are ${user.age} years old.` : ""}

STRICT RULES — if you break any of these the message fails:
- Never say "I'm here for you", "you're not alone", "I'm so sorry to hear that", "sending love", "safe space", "it's okay to feel"
- Never use phrases like "it sounds like", "I can imagine", "I understand how you feel"
- Never start with "Hey ${user.name}" — just get straight to what you want to say
- No bullet points, no lists, no paragraphs
- Max 2 sentences — short like a real text message
- Sound like a human who actually knows them, not a wellness app
- Reference something specific from the conversation if possible`;

  const prompts = {
    event_followup: `${baseRules}

Context: This morning ${user.name} mentioned something they were stressed or nervous about.
Morning message: "${morningMessage}"
You want to casually ask how it went — like a friend who remembered and is genuinely curious.
The message MUST end with a question — open ended, something they'd actually want to answer.
NEVER end with a statement or motivation. Always a question.
Example vibe: "yo how did that thing with your manager go??" or "wait how did the presentation go, tell me everything"
Write the message:`,

    evening_checkin: `${baseRules}

Context: ${user.name} started the day feeling ${checkin.mood_label}.
Morning message: "${morningMessage}"
It's evening. Ask them something real — make them want to open the app and reply.
The message MUST end with a question — something open ended that invites them to talk.
NEVER send motivation or advice. A friend asks, they don't lecture.
Example vibe: "okay but how are you actually doing rn?" or "how did today end up going?"
Write the message:`,

    night_checkin: `${baseRules}

Context: ${user.name} started the day feeling ${checkin.mood_label}.
Morning message: "${morningMessage}"
It's night. Check in gently — but still end with a question so they feel like replying.
The message MUST end with a question. No motivational endings, no "you got this", no advice.
Example vibe: "how was today in the end?" or "did things get any better after this morning?"
Write the message:`,
  };

  const systemPrompt = prompts[type] || prompts.evening_checkin;
  const messages = [new SystemMessage(systemPrompt)];

  recentHistory.forEach((msg) => {
    messages.push(
      msg.role === "user"
        ? new HumanMessage(msg.message)
        : new AIMessage(msg.message),
    );
  });

  console.log(
    `Generating ${type} message for ${user.name} (age: ${user.age}, location: ${location})...`,
  );
  const response = await llm.invoke(messages);
  console.log("Generated message:", response.content);
  return response.content;
};

// ── Email subject lines per message type ─────────────────────
const getEmailSubject = (type, userName) => {
  const subjects = {
    event_followup: `hey, how did it go? 👀`,
    evening_checkin: `checking in on you ☀️`,
    night_checkin: `hope today was good 🌙`,
  };
  return subjects[type] || `a message from mendi 💛`;
};

// ── Styled HTML email template ────────────────────────────────
const buildEmailHtml = (userName, messageText, type) => {
  const emojiMap = {
    event_followup: "👀",
    evening_checkin: "☀️",
    night_checkin: "🌙",
  };
  const emoji = emojiMap[type] || "💛";
  const appUrl = process.env.APP_URL || "http://localhost:5173";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Mendi</title>
      </head>
      <body style="margin:0;padding:0;background-color:#0f172a;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
                <tr>
                  <td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:32px 40px 24px;border-bottom:1px solid #334155;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <div style="width:40px;height:40px;background:linear-gradient(135deg,#fbbf24,#f87171);border-radius:50%;display:inline-block;line-height:40px;text-align:center;font-size:18px;">${emoji}</div>
                        </td>
                        <td style="padding-left:12px;vertical-align:middle;">
                          <span style="color:#fbbf24;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Mendi</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:36px 40px;">
                    <p style="color:#f1f5f9;font-size:20px;line-height:1.7;margin:0 0 28px 0;font-style:italic;">${messageText}</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(135deg,#fbbf24,#f87171);border-radius:10px;padding:1px;">
                          <a href="${appUrl}/home"
                             style="display:inline-block;background:#1e293b;color:#fbbf24;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:9px;letter-spacing:0.3px;">
                            Reply to Mendi →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 40px 28px;border-top:1px solid #334155;">
                    <p style="color:#475569;font-size:12px;margin:0;line-height:1.6;">
                      You're receiving this because you checked in with Mendi today.<br/>
                      <a href="${appUrl}/home" style="color:#64748b;text-decoration:underline;">Open Mendi</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

// ── Send email ────────────────────────────────────────────────
const sendEmail = async (toEmail, userName, messageText, type) => {
  await sendMail({
    email: toEmail,
    subject: getEmailSubject(type, userName),
    html: buildEmailHtml(userName, messageText, type),
  });
};

// ── Main processor ────────────────────────────────────────────
const processScheduledMessages = async () => {
  const now = new Date().toISOString();

  const { data: dueMessages, error } = await supabase
    .from("scheduled_messages")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now);

  if (error) {
    console.error("Error fetching scheduled messages:", error.message);
    return;
  }
  if (!dueMessages?.length) return;

  console.log(`Processing ${dueMessages.length} scheduled message(s)...`);

  for (const scheduledMsg of dueMessages) {
    try {
      // fetch age, city, area alongside name and email
      const { data: user } = await supabase
        .from("users")
        .select("name, email, age, city, area")
        .eq("id", scheduledMsg.user_id)
        .single();

      if (!user) {
        console.warn(`No user found for id ${scheduledMsg.user_id}, skipping`);
        await supabase
          .from("scheduled_messages")
          .update({ status: "skipped" })
          .eq("id", scheduledMsg.id);
        continue;
      }

      const today = new Date().toISOString().split("T")[0];
      const { data: checkin } = await supabase
        .from("daily_checkins")
        .select("*")
        .eq("user_id", scheduledMsg.user_id)
        .eq("checkin_date", today)
        .single();

      if (!checkin) {
        console.warn(
          `No checkin found for user ${user.name} on ${today}, skipping`,
        );
        await supabase
          .from("scheduled_messages")
          .update({ status: "skipped" })
          .eq("id", scheduledMsg.id);
        continue;
      }

      console.log(`Checkin found: ${checkin.id}, mood: ${checkin.mood_label}`);

      const history = await getConversationHistory(
        scheduledMsg.user_id,
        checkin.id,
      );

      const messageText = await generateProactiveMessage(
        scheduledMsg.message_type,
        user,
        checkin,
        history,
      );

      // 1. save to conversations → appears in chat via polling
      await supabase.from("conversations").insert({
        user_id: scheduledMsg.user_id,
        checkin_id: checkin.id,
        role: "assistant",
        message: messageText,
        message_type: scheduledMsg.message_type,
      });

      // 2. send email
      await sendEmail(
        user.email,
        user.name,
        messageText,
        scheduledMsg.message_type,
      );

      // 3. mark as sent
      await supabase
        .from("scheduled_messages")
        .update({ status: "sent" })
        .eq("id", scheduledMsg.id);

      console.log(
        `✓ Sent ${scheduledMsg.message_type} to ${user.name} (${user.email})`,
      );
    } catch (err) {
      console.error(`✗ Failed to process message ${scheduledMsg.id}:`);
      console.error(`  Message: ${err.message}`);
      console.error(`  Stack: ${err.stack}`);
    }
  }
};

// ── Start the cron job ────────────────────────────────────────
export const startScheduler = () => {
  cron.schedule("* * * * *", processScheduledMessages);
  console.log("Message scheduler started ✓");
};
