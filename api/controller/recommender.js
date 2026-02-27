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
      Example: "there's this movie that's genuinely just warm and stupid in the best way, it's called XYZ, just put it on" 
      or "honestly something light and dumb is what you need tonight — have you seen XYZ?"`,

    food: `FOOD: Suggest a type of food or cuisine that fits their mood — naturally, like a friend casually mentioning it.
      Don't just say "order something" — actually hint at what kind of food, like "something warm and soupy" or "honestly biryani energy tonight".
      ${location ? `They're in ${location} — think about what's common/available there but don't mention the location name.` : ""}
      Sad/stressed → comfort food vibes: something warm, filling, familiar. Think dal chawal energy, hot soup, maggi, biryani, whatever fits.
      Happy → something fun or celebratory: pizza, chaat, ice cream, whatever feels like a treat.
      
      The key: make it feel like a natural mention, not a prescription.
      Good examples: 
        "also feels like a biryani kind of night honestly"
        "maybe get something warm and soupy, idk just feels right"
        "this is a chaat moment if I've ever seen one"
        "treat yourself to something good tonight, pizza or whatever makes you happy"
      BAD examples (never do this):
        "I recommend you eat Pav Bhaji"
        "you should order some food"
        "get yourself something to eat"
        "order something indulgent" (too vague, actually mention a food type)`,
  };

  const recommendationsNeeded = types
    .map((t) => typeInstructions[t])
    .join("\n\n");

  const morningMoodContext = checkin
    ? `They started the day feeling ${checkin.mood_label} (${checkin.mood_score}/10).`
    : "";

  // derive vibe from age + mood together
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
      Let the vibe shape HOW you say things, not what you say.
      
      Here's what to weave into one natural message:
      ${recommendationsNeeded}
      
      RULES — read carefully:
      - Write ONE flowing message like a text, not a list or review
      - Song name can be dropped naturally — friends do this
      - Movie: hint at it casually, don't make it sound like a review
      - Food: mention a type naturally — "biryani energy tonight" not "I recommend biryani"
      - No bullet points, no bold, no "I recommend", no "you should"
      - Max 3-4 sentences total
      - The mood + age vibe should come through in your tone naturally
      - End light — like wrapping up a good late night conversation`),
    new HumanMessage(
      `Based on our conversation tonight, what would you suggest for me?`,
    ),
  ]);

  return {
    message: response.content,
    types,
    mood: nightMood,
    language,
  };
};

// ── Build recommendation email HTML ──────────────────────────
const buildRecommendationEmail = (userName, messageText, types, appUrl) => {
  const hasMovie = types.includes("movie");
  const hasSong = types.includes("song");
  const hasFood = types.includes("food");

  const tagline =
    hasMovie && hasSong && hasFood
      ? "a song, a movie & something to eat 🌙"
      : hasSong && hasFood
        ? "a song & something to eat ✨"
        : "a song for tonight 🎵";

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
                
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:32px 40px 24px;border-bottom:1px solid #334155;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <div style="width:40px;height:40px;background:linear-gradient(135deg,#fbbf24,#f87171);border-radius:50%;display:inline-block;line-height:40px;text-align:center;font-size:18px;">🌙</div>
                        </td>
                        <td style="padding-left:12px;vertical-align:middle;">
                          <span style="color:#fbbf24;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Mendi</span>
                          <p style="color:#64748b;font-size:12px;margin:2px 0 0 0;">picked ${tagline} for you</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    <p style="color:#94a3b8;font-size:13px;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:1px;">hey ${userName} 🌙</p>
                    <p style="color:#f1f5f9;font-size:18px;line-height:1.8;margin:0 0 32px 0;">${messageText}</p>

                    <!-- CTA -->
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(135deg,#fbbf24,#f87171);border-radius:10px;padding:1px;">
                          <a href="${appUrl}/home"
                             style="display:inline-block;background:#1e293b;color:#fbbf24;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:9px;letter-spacing:0.3px;">
                            Continue talking →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 40px 28px;border-top:1px solid #334155;">
                    <p style="color:#475569;font-size:12px;margin:0;line-height:1.6;">
                      From your friend at Mendi 💛<br/>
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

// ── Main export: trigger recommendations after night reply ────
export const handleNightRecommendation = async (
  userId,
  checkinId,
  history,
  user,
  checkin,
) => {
  try {
    // need at least 2 user messages after the night checkin to trigger
    const userMessagesCount = history.filter((m) => m.role === "user").length;
    if (userMessagesCount < 2) return null; // too early, wait for more context

    // detect language and current mood from recent messages
    const [language, nightMood] = await Promise.all([
      detectLanguage(history),
      detectNightMood(history),
    ]);

    console.log(
      `Night recommendation: mood=${nightMood.mood_label}(${nightMood.mood_score}), language=${language}`,
    );

    // generate the recommendation
    const result = await generateRecommendation(
      user,
      checkin,
      nightMood,
      language,
      history,
    );

    // save to conversations
    await supabase.from("conversations").insert({
      user_id: userId,
      checkin_id: checkinId,
      role: "assistant",
      message: result.message,
      message_type: "night_recommendation",
    });

    // send email
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    await sendMail({
      email: user.email,
      subject: `tonight's picks just for you 🌙`,
      html: buildRecommendationEmail(
        user.name,
        result.message,
        result.types,
        appUrl,
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
