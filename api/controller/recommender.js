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

// ── Detect language from conversation history ─────────────────
const detectLanguage = async (history) => {
  const sampleMessages = history
    .filter((m) => m.role === "user")
    .slice(-5)
    .map((m) => m.message)
    .join(" | ");

  if (!sampleMessages) return "English";

  const response = await llm.invoke([
    new SystemMessage(`You are a language detector.
      Given these messages from a user, detect the primary language they write in.
      Return ONLY a JSON object like: { "language": "Hindi" }
      Options: English, Hindi, Hinglish, Marathi, Tamil, Telugu, Bengali, Punjabi
      Hinglish = mix of Hindi and English words written in Roman script.
      Pick whichever fits best.`),
    new HumanMessage(sampleMessages),
  ]);

  try {
    const cleaned = response.content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return parsed.language || "English";
  } catch {
    return "English";
  }
};

// ── Re-detect mood from night reply ──────────────────────────
const detectNightMood = async (recentMessages) => {
  const userMessages = recentMessages
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.message)
    .join(" | ");

  const response = await llm.invoke([
    new SystemMessage(`You are a mood detector. Given these messages, return ONLY a JSON object:
      { "mood_label": "anxious", "mood_score": 4 }
      mood_label must be one of: happy, okay, anxious, sad, stressed, angry
      mood_score is 1-10 where 1=terrible, 10=great`),
    new HumanMessage(userMessages),
  ]);

  try {
    const cleaned = response.content.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { mood_label: "okay", mood_score: 5 };
  }
};

// ── Decide what to recommend based on mood score ──────────────
const getRecommendationTypes = (moodScore) => {
  if (moodScore <= 4) return ["song", "movie", "food"];
  if (moodScore <= 7) return ["song", "food"];
  return ["song"];
};

// ── Build Zomato URL from city + dish ────────────────────────
const getZomatoLink = (city, dish) => {
  const citySlug = city?.toLowerCase().trim().replace(/\s+/g, "-") || "";
  const dishQuery = encodeURIComponent(dish || "");
  if (citySlug && dishQuery)
    return `https://www.zomato.com/${citySlug}/delivery?query=${dishQuery}`;
  if (citySlug) return `https://www.zomato.com/${citySlug}`;
  return "https://www.zomato.com";
};

// ── Generate the full recommendation message ──────────────────
const generateRecommendation = async (
  user,
  checkin,
  nightMood,
  language,
  history,
) => {
  const types = getRecommendationTypes(nightMood.mood_score);
  const location = [user.area, user.city].filter(Boolean).join(", ");

  const typeInstructions = {
    song: `SONG: Name ONE specific real song with artist name that fits their mood.
      Match language: ${language}. Age: ${user.age || "unknown"}.
      Sad/stressed → soothing or relatable lyrics. Happy → fun vibe.
      You CAN mention the song name directly — that's natural for a friend to do.
      Example: "btw put on Kesariya tonight, just trust me" or "Arijit's Tum Hi Ho hits different when you're feeling this way"`,

    movie: `MOVIE: You want to nudge them toward a movie but DON'T name it directly like a robot.
      Instead hint at it like a friend — describe the vibe or feeling of the movie, then casually drop the name at the end if it flows.
      Match language: ${language}. Age: ${user.age || "unknown"}.
      Sad/stressed → something cozy, funny, or comforting — NOT heavy or sad.
      Example: "there's this movie that's genuinely just warm and stupid in the best way, it's called XYZ, just put it on"`,

    food: `FOOD: Suggest a type of food or cuisine that fits their mood — naturally, like a friend casually mentioning it.
      Don't just say "order something" — actually hint at what kind of food.
      ${location ? `They're in ${location} — think about what's common/available there but don't mention the location name.` : ""}
      Sad/stressed → comfort food: dal chawal energy, hot soup, biryani, whatever fits.
      Happy → something fun: pizza, chaat, ice cream.
      Good: "also feels like a biryani kind of night honestly" Bad: "I recommend you eat Pav Bhaji"`,
  };

  const recommendationsNeeded = types
    .map((t) => typeInstructions[t])
    .join("\n\n");
  const morningMoodContext = checkin
    ? `They started the day feeling ${checkin.mood_label} (${checkin.mood_score}/10).`
    : "";

  const age = user.age;
  const score = nightMood.mood_score;
  const ageBucket = !age
    ? "adult"
    : age <= 15
      ? "teen"
      : age <= 22
        ? "young"
        : age <= 35
          ? "adult"
          : age <= 55
            ? "midlife"
            : "senior";
  const moodEnergy = score <= 4 ? "low" : score <= 7 ? "okay" : "good";

  const vibeMap = {
    teen: {
      low: "gentle older sibling energy — soft, simple, caring, no pressure",
      okay: "chill older sibling — easy and light",
      good: "hyped sibling energy — fun and short",
    },
    young: {
      low: "close friend who gets it — raw and real, skip the fluff, no toxic positivity",
      okay: "casual college friend just checking in",
      good: "excited friend energy — playful and fun",
    },
    adult: {
      low: "grounded good friend — warm but not dramatic, real talk, no nonsense",
      okay: "easy and warm, like a reliable friend",
      good: "genuine and light, happy for them",
    },
    midlife: {
      low: "steady and calm — like a trusted friend who doesn't overreact",
      okay: "warm and easy, just catching up",
      good: "genuinely happy, light and simple",
    },
    senior: {
      low: "gentle and kind — simple words, very warm, no slang",
      okay: "warm and simple like an old friend",
      good: "warm and cheerful, gentle",
    },
  };

  const messageVibe = vibeMap[ageBucket]?.[moodEnergy] || "warm and casual";

  const response = await llm.invoke([
    new SystemMessage(`You are texting ${user.name} like a real close friend late at night.
      They've opened up to you and now you want to wrap up with something thoughtful.
      Their current mood: ${nightMood.mood_label} (${nightMood.mood_score}/10).
      ${morningMoodContext}
      Age: ${user.age || "unknown"}. Language they use: ${language}.
      Your vibe for this message: ${messageVibe}
      Here's what to weave into one natural message:
      ${recommendationsNeeded}
      RULES:
      - Write ONE flowing message like a text, not a list
      - Song name can be dropped naturally
      - Movie: hint at it casually
      - Food: mention a type naturally — "biryani energy tonight" not "I recommend biryani"
      - No bullet points, no bold, no "I recommend", no "you should"
      - Max 3-4 sentences total
      - End light — like wrapping up a good late night conversation`),
    new HumanMessage(
      `Based on our conversation tonight, what would you suggest for me?`,
    ),
  ]);

  // ── Extract dish name for Zomato search ──
  let dish = "";
  if (types.includes("food")) {
    try {
      const dishResponse = await llm.invoke([
        new SystemMessage(`Extract ONLY the food or dish type mentioned in this message as a short search term (1-3 words max).
          Return ONLY a JSON object like: { "dish": "biryani" } or { "dish": "hot soup" }
          If no specific food is mentioned, return { "dish": "" }
          Just the food name — no extra words.`),
        new HumanMessage(response.content),
      ]);
      const cleaned = dishResponse.content.replace(/```json|```/g, "").trim();
      dish = JSON.parse(cleaned).dish || "";
    } catch {
      dish = "";
    }
    console.log(`Dish extracted for Zomato: "${dish}"`);
  }

  return { message: response.content, types, mood: nightMood, language, dish };
};

// ── Mood accent colors ────────────────────────────────────────
const getMoodAccent = (moodLabel) => {
  const accents = {
    happy: { from: "#f59e0b", to: "#ef4444", text: "#fbbf24" },
    okay: { from: "#6366f1", to: "#8b5cf6", text: "#a78bfa" },
    anxious: { from: "#8b5cf6", to: "#6366f1", text: "#c4b5fd" },
    sad: { from: "#3b82f6", to: "#6366f1", text: "#93c5fd" },
    stressed: { from: "#ec4899", to: "#8b5cf6", text: "#f9a8d4" },
    angry: { from: "#ef4444", to: "#f97316", text: "#fca5a5" },
  };
  return accents[moodLabel] || accents.okay;
};

const typePill = (label, emoji) =>
  `<span style="display:inline-block;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);color:#64748b;font-size:11px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;padding:5px 12px;border-radius:20px;margin-right:6px;margin-bottom:6px;">${emoji}&nbsp;${label}</span>`;

// ── Build recommendation email HTML ──────────────────────────
const buildRecommendationEmail = (
  userName,
  messageText,
  types,
  appUrl,
  city,
  dish,
  moodLabel,
  checkinId,
) => {
  const hasMovie = types.includes("movie");
  const hasSong = types.includes("song");
  const hasFood = types.includes("food");
  const accent = getMoodAccent(moodLabel);

  const tagline =
    hasMovie && hasSong && hasFood
      ? "a song, a film &amp; something to eat"
      : hasSong && hasFood
        ? "a song &amp; something to eat"
        : "a song for tonight";

  const pills = [
    hasSong && typePill("song", "🎵"),
    hasMovie && typePill("film", "🎬"),
    hasFood && typePill("food", "🍽️"),
  ]
    .filter(Boolean)
    .join("");

  // ── Reply URL carries checkin context ──
  const replyUrl = `${appUrl}/home?reply=${checkinId}&type=night_recommendation`;
  const zomatoUrl = getZomatoLink(city, dish);

  const zomatoButton = hasFood
    ? `
              <tr>
                <td style="padding:0 44px 36px;">
                  <p style="color:#334155;font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;margin:0 0 14px 0;">order it</p>
                  <a href="${zomatoUrl}"
                     style="display:inline-block;background:#e23744;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 28px;border-radius:12px;letter-spacing:0.1px;font-family:Helvetica,Arial,sans-serif;">
                    🍴&nbsp; Order on Zomato${dish ? `&nbsp;·&nbsp;${dish}` : ""}
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:0 44px 8px;">
                  <div style="height:1px;background:linear-gradient(90deg,#1e293b,transparent);"></div>
                </td>
              </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Mendi</title>
</head>
<body style="margin:0;padding:0;background:#06090f;font-family:Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#06090f;padding:52px 20px 64px;">
  <tr>
    <td align="center">
      <table width="520" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;width:100%;">

        <!-- wordmark -->
        <tr>
          <td style="padding:0 4px 24px;">
            <span style="font-size:11px;font-weight:800;letter-spacing:4px;text-transform:uppercase;color:${accent.from};">MENDI</span>
          </td>
        </tr>

        <!-- card -->
        <tr>
          <td style="background:#0c1220;border-radius:24px;border:1px solid #131c2e;overflow:hidden;">

            <!-- mood gradient bar -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="height:2px;background:linear-gradient(90deg,${accent.from},${accent.to},transparent);"></td></tr>
            </table>

            <!-- header -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:36px 44px 24px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align:top;padding-top:2px;">
                        <div style="width:42px;height:42px;background:linear-gradient(135deg,${accent.from},${accent.to});border-radius:13px;text-align:center;line-height:42px;font-size:19px;display:inline-block;">🌙</div>
                      </td>
                      <td style="padding-left:14px;vertical-align:top;">
                        <p style="margin:0 0 3px;color:#e2e8f0;font-size:17px;font-weight:700;letter-spacing:-0.2px;">tonight's picks</p>
                        <p style="margin:0;color:#334155;font-size:12px;letter-spacing:0.2px;">${tagline}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- thin rule -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:0 44px;"><div style="height:1px;background:#131c2e;"></div></td></tr>
            </table>

            <!-- greeting + message -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:32px 44px 6px;">
                  <p style="margin:0;color:#334155;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;">hey ${userName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 44px 28px;">
                  <p style="margin:0;color:#94a3b8;font-size:16px;line-height:1.9;">${messageText}</p>
                </td>
              </tr>
            </table>

            <!-- pills -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:0 44px 32px;">${pills}</td></tr>
            </table>

            <!-- rule -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:0 44px;"><div style="height:1px;background:#131c2e;"></div></td></tr>
            </table>

            ${zomatoButton}

            <!-- reply CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:32px 44px 40px;">
                  <a href="${replyUrl}"
                     style="display:inline-block;color:${accent.text};text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.3px;border-bottom:1px solid ${accent.text};padding-bottom:2px;font-family:Helvetica,Arial,sans-serif;">
                    reply to mendi →
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td style="padding:24px 4px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td><p style="margin:0;color:#1e293b;font-size:11px;">from your friend at mendi 💛</p></td>
                <td align="right"><a href="${appUrl}/home" style="color:#1e293b;font-size:11px;text-decoration:none;">open app</a></td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
};

// ── Main export ───────────────────────────────────────────────
export const handleNightRecommendation = async (
  userId,
  checkinId,
  history,
  user,
  checkin,
) => {
  try {
    const userMessagesCount = history.filter((m) => m.role === "user").length;
    if (userMessagesCount < 2) return null;

    const [language, nightMood] = await Promise.all([
      detectLanguage(history),
      detectNightMood(history),
    ]);

    console.log(
      `Night recommendation: mood=${nightMood.mood_label}(${nightMood.mood_score}), language=${language}`,
    );

    const result = await generateRecommendation(
      user,
      checkin,
      nightMood,
      language,
      history,
    );

    await supabase.from("conversations").insert({
      user_id: userId,
      checkin_id: checkinId,
      role: "assistant",
      message: result.message,
      message_type: "night_recommendation",
    });

    const appUrl = process.env.APP_URL || "http://localhost:5173";
    await sendMail({
      email: user.email,
      subject: `tonight's picks for you 🌙`,
      html: buildRecommendationEmail(
        user.name,
        result.message,
        result.types,
        appUrl,
        user.city,
        result.dish,
        nightMood.mood_label,
        checkinId, // ← passed so reply URL works
      ),
    });

    console.log(
      `✓ Night recommendation sent to ${user.name} (${result.types.join(", ")})`,
    );
    return result;
  } catch (err) {
    console.error("Night recommendation error:", err.message);
    return null;
  }
};
