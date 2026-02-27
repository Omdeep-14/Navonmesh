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
  temperature: 0.8,
});

// ── Fetch conversation history ────────────────────────────────
const getConversationHistory = async (userId, checkinId) => {
  const { data } = await supabase
    .from("conversations")
    .select("role, message")
    .eq("user_id", userId)
    .eq("checkin_id", checkinId)
    .order("created_at", { ascending: true });
  return data || [];
};

// ── Generate proactive AI message ────────────────────────────
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

// ── Email subject lines per message type ─────────────────────
const getEmailSubject = (type, userName) => {
  const subjects = {
    event_followup: `Hey ${userName}, how did it go? 💬`,
    evening_checkin: `Checking in on you this evening 🌇`,
    night_checkin: `Hope your day went well 🌙`,
  };
  return subjects[type] || `A message from Mendi 💛`;
};

// ── Styled HTML email template ────────────────────────────────
const buildEmailHtml = (userName, messageText, type) => {
  const emojiMap = {
    event_followup: "💬",
    evening_checkin: "🌇",
    night_checkin: "🌙",
  };
  const emoji = emojiMap[type] || "💛";

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
                    <p style="color:#94a3b8;font-size:14px;margin:0 0 8px 0;text-transform:uppercase;letter-spacing:1px;">Hey ${userName}</p>
                    <p style="color:#f1f5f9;font-size:18px;line-height:1.7;margin:0 0 28px 0;">${messageText}</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(135deg,#fbbf24,#f87171);border-radius:10px;padding:1px;">
                          <a href="${process.env.APP_URL}"
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
                      <a href="${process.env.APP_URL}" style="color:#64748b;text-decoration:underline;">Open Mendi</a>
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

  if (error || !dueMessages?.length) return;

  console.log(`Processing ${dueMessages.length} scheduled message(s)...`);

  for (const scheduledMsg of dueMessages) {
    try {
      const { data: user } = await supabase
        .from("users")
        .select("name, email, city, area")
        .eq("id", scheduledMsg.user_id)
        .single();

      if (!user) {
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
        await supabase
          .from("scheduled_messages")
          .update({ status: "skipped" })
          .eq("id", scheduledMsg.id);
        continue;
      }

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

      console.log("Attempting email to:", user.email);
      console.log("SMTP_USER:", process.env.SMTP_USER);
      console.log("SMTP_PASS:", process.env.SMTP_PASS ? "exists" : "UNDEFINED");

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
      console.error(`✗ Full error:`, JSON.stringify(err, null, 2));
      console.error(`✗ Error message:`, err.message);
      console.error(`✗ Error stack:`, err.stack);
      console.error(
        `✗ Failed to process message ${scheduledMsg.id}:`,
        err.message,
      );
      // stays 'pending' → retries next minute
    }
  }
};

// ── Start the cron job ────────────────────────────────────────
export const startScheduler = () => {
  cron.schedule("* * * * *", processScheduledMessages);
  console.log("Message scheduler started ✓");
};
