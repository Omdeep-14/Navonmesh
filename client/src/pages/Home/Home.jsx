import { useState, useEffect, useRef } from "react";

// ── Mood system ───────────────────────────────────────────────
const MOOD_SCORE = {
  happy: 90, calm: 75, okay: 55, neutral: 50,
  stressed: 38, anxious: 28, sad: 20, angry: 18, depressed: 8, suicidal: 2,
};
const MOOD_COLORS = {
  happy:     { line: "#34d399", dot: "#34d399", label: "text-emerald-300", bg: "rgba(52,211,153,0.12)" },
  calm:      { line: "#6ee7b7", dot: "#6ee7b7", label: "text-teal-300",    bg: "rgba(110,231,183,0.12)" },
  okay:      { line: "#93c5fd", dot: "#93c5fd", label: "text-blue-300",    bg: "rgba(147,197,253,0.12)" },
  neutral:   { line: "#94a3b8", dot: "#94a3b8", label: "text-slate-300",   bg: "rgba(148,163,184,0.12)" },
  stressed:  { line: "#fbbf24", dot: "#fbbf24", label: "text-amber-300",   bg: "rgba(251,191,36,0.12)" },
  anxious:   { line: "#fb923c", dot: "#fb923c", label: "text-orange-300",  bg: "rgba(251,146,60,0.12)" },
  sad:       { line: "#818cf8", dot: "#818cf8", label: "text-indigo-300",  bg: "rgba(129,140,248,0.12)" },
  angry:     { line: "#f87171", dot: "#f87171", label: "text-red-300",     bg: "rgba(248,113,113,0.12)" },
  depressed: { line: "#a78bfa", dot: "#a78bfa", label: "text-violet-300",  bg: "rgba(167,139,250,0.12)" },
  suicidal:  { line: "#e879f9", dot: "#e879f9", label: "text-fuchsia-300", bg: "rgba(232,121,249,0.12)" },
};
const MOOD_EMOJIS = {
  happy: "😊", calm: "🌿", okay: "🙂", neutral: "😐",
  stressed: "😩", anxious: "😰", sad: "😢", angry: "😤",
  depressed: "😔", suicidal: "💜",
};
const getMoodColor = (mood) => MOOD_COLORS[mood] || MOOD_COLORS.neutral;
const getMoodScore = (mood) => MOOD_SCORE[mood] ?? 50;

const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const friendlyDay = (dateStr) => {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  const d = new Date(dateStr).toDateString();
  if (d === today) return "Today";
  if (d === yesterday) return "Yesterday";
  return new Date(dateStr).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
};
const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
};
const groupByDay = (items) => {
  const groups = {};
  items.forEach((m) => { const day = new Date(m.timestamp).toDateString(); if (!groups[day]) groups[day] = []; groups[day].push(m); });
  return groups;
};
const dominantMood = (items) => {
  if (!items?.length) return "neutral";
  const counts = items.reduce((a, e) => { a[e.mood] = (a[e.mood] || 0) + 1; return a; }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
};

// ── Mood Badge ────────────────────────────────────────────────
const MoodBadge = ({ mood }) => {
  const c = getMoodColor(mood);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.label}`} style={{ background: c.bg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {mood}
    </span>
  );
};

// ── Chat Bubble ───────────────────────────────────────────────
const ChatBubble = ({ msg }) => {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm mr-2 mt-1 flex-shrink-0" style={{ background: "linear-gradient(135deg,#fbbf24,#fb7185)" }}>
          🌙
        </div>
      )}
      <div className={`max-w-xs lg:max-w-sm flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        {msg.mood && isUser && <div className="flex justify-end"><MoodBadge mood={msg.mood} /></div>}
        <div
          className="px-4 py-3 text-sm leading-relaxed"
          style={isUser
            ? { background: "linear-gradient(135deg,#f59e0b,#f43f5e)", color: "#fff", borderRadius: "1rem 1rem 0.25rem 1rem" }
            : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", borderRadius: "0.25rem 1rem 1rem 1rem", backdropFilter: "blur(8px)" }
          }
        >
          {msg.content}
        </div>
        <span className="text-slate-600 text-xs">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
};

// ── Mood Line Graph ───────────────────────────────────────────
const MoodLineGraph = ({ history }) => {
  const canvasRef = useRef(null);
  const W = 560, H = 200, PAD = { top: 20, right: 20, bottom: 30, left: 34 };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + ((H - PAD.top - PAD.bottom) * i) / 4;
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
    }

    const dayGroups = groupByDay(history);
    const dayKeys = Object.keys(dayGroups).sort((a, b) => new Date(a) - new Date(b)).slice(-14);
    const points = dayKeys.map((day) => {
      const entries = dayGroups[day];
      const avg = entries.reduce((s, e) => s + getMoodScore(e.mood), 0) / entries.length;
      return { day, score: avg, mood: dominantMood(entries) };
    });

    if (points.length < 2) {
      ctx.fillStyle = "rgba(148,163,184,0.3)";
      ctx.font = "13px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Add more check-ins to see your mood curve", W / 2, H / 2);
      return;
    }

    const gW = W - PAD.left - PAD.right;
    const gH = H - PAD.top - PAD.bottom;
    const xOf = (i) => PAD.left + (i / (points.length - 1)) * gW;
    const yOf = (score) => PAD.top + (1 - score / 100) * gH;

    // Gradient stroke
    const grad = ctx.createLinearGradient(PAD.left, 0, W - PAD.right, 0);
    points.forEach((p, i) => grad.addColorStop(i / (points.length - 1), getMoodColor(p.mood).line));
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(points[0].score));
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];
      const cp1x = xOf(i) + (xOf(i + 1) - xOf(Math.max(i - 1, 0))) / 6;
      const cp1y = yOf(p1.score) + (yOf(p2.score) - yOf(p0.score)) / 6;
      const cp2x = xOf(i + 1) - (xOf(Math.min(i + 2, points.length - 1)) - xOf(i)) / 6;
      const cp2y = yOf(p2.score) - (yOf(p3.score) - yOf(p1.score)) / 6;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, xOf(i + 1), yOf(p2.score));
    }
    ctx.stroke();

    // Dots with glow
    points.forEach((p, i) => {
      const x = xOf(i), y = yOf(p.score);
      const color = getMoodColor(p.mood).dot;
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10;
      ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(148,163,184,0.5)";
      ctx.font = "10px Inter, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(friendlyDay(p.day).split(",")[0], x, H - 5);
    });

    // Y labels
    [["😊", 90], ["—", 50], ["💜", 10]].forEach(([t, s]) => {
      ctx.fillStyle = "rgba(100,116,139,0.5)";
      ctx.font = "10px Inter, sans-serif"; ctx.textAlign = "left";
      ctx.fillText(t, 2, yOf(s) + 4);
    });
  }, [history]);

  return <canvas ref={canvasRef} style={{ display: "block", maxWidth: "100%" }} />;
};

// ── Sidebar ───────────────────────────────────────────────────
const Sidebar = ({ user, allMessages, activeView, setActiveView, onResetChat, onOpenDayChat }) => {
  const dayGroups = groupByDay(allMessages);
  const dayKeys = Object.keys(dayGroups).sort((a, b) => new Date(b) - new Date(a));

  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col h-full"
      style={{
        background: "rgba(8,12,25,0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🌙</span>
          <span className="text-base font-bold font-serif text-amber-300">Mendi</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-slate-900" style={{ background: "linear-gradient(135deg,#fbbf24,#fb7185)" }}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-white text-sm font-medium">{user?.name || "You"}</p>
            <p className="text-slate-600 text-xs">{[user?.city, user?.area].filter(Boolean).join(", ")}</p>
          </div>
        </div>
      </div>

      <div className="px-3 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { id: "chat", icon: "💬", label: "Chat with Mendi" },
          { id: "history", icon: "📅", label: "Mood History" },
        ].map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => { setActiveView(id); if (id === "chat") onResetChat(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1"
            style={activeView === id
              ? { background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }
              : { background: "transparent", color: "#475569", border: "1px solid transparent" }
            }
            onMouseEnter={(e) => { if (activeView !== id) { e.currentTarget.style.color = "#e2e8f0"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; } }}
            onMouseLeave={(e) => { if (activeView !== id) { e.currentTarget.style.color = "#475569"; e.currentTarget.style.background = "transparent"; } }}
          >
            <span>{icon}</span>{label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="text-slate-700 text-xs font-medium uppercase tracking-wider mb-2 px-1">Sessions</p>
        {dayKeys.length === 0 ? (
          <p className="text-slate-700 text-sm text-center mt-8">No sessions yet 🌱</p>
        ) : (
          <div className="space-y-1">
            {dayKeys.map((day) => {
              const msgs = dayGroups[day];
              const userMsgs = msgs.filter((m) => m.role === "user");
              const mood = dominantMood(userMsgs);
              return (
                <button
                  key={day}
                  onClick={() => { onOpenDayChat(day, msgs); setActiveView("chat"); }}
                  className="w-full text-left px-3 py-2.5 rounded-xl transition-all"
                  style={{ border: "1px solid transparent" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-slate-500 text-xs font-medium">{friendlyDay(day)}</span>
                    <span className="text-sm">{MOOD_EMOJIS[mood] || "😐"}</span>
                  </div>
                  <p className="text-slate-700 text-xs">{userMsgs.length} message{userMsgs.length !== 1 ? "s" : ""}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};

// ── Input Bar ─────────────────────────────────────────────────
const InputBar = ({ onSend, isTyping }) => {
  const [text, setText] = useState("");
  const handleSend = () => { if (!text.trim()) return; onSend(text.trim()); setText(""); };
  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <div className="p-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,12,25,0.7)", backdropFilter: "blur(12px)" }}>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Share how you're feeling..."
            rows={1}
            className="glass-input"
            style={{ resize: "none", minHeight: "44px", maxHeight: "120px" }}
            onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!text.trim() || isTyping}
          className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold flex-shrink-0 transition-all"
          style={{
            background: "linear-gradient(135deg,#fbbf24,#fb7185)",
            color: "#0f172a",
            opacity: (!text.trim() || isTyping) ? 0.35 : 1,
          }}
          onMouseEnter={(e) => { if (text.trim() && !isTyping) { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(251,191,36,0.4)"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          →
        </button>
      </div>
    </div>
  );
};

// ── Mood History View ─────────────────────────────────────────
const MoodHistoryView = ({ history }) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const dayGroups = groupByDay(history);
  const dayKeys = Object.keys(dayGroups).sort((a, b) => new Date(b) - new Date(a));

  if (selectedDay) {
    const entries = dayGroups[selectedDay] || [];
    const dayMoodCounts = entries.reduce((acc, e) => { acc[e.mood] = (acc[e.mood] || 0) + 1; return acc; }, {});
    const dayTotal = entries.length;
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <button
          onClick={() => setSelectedDay(null)}
          className="flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: "#64748b" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#e2e8f0"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#64748b"}
        >
          ← Back to all days
        </button>
        <h2 className="text-2xl font-bold font-serif text-white mb-1">{friendlyDay(selectedDay)}</h2>
        <p className="text-slate-500 text-sm mb-6">{entries.length} mood {entries.length !== 1 ? "entries" : "entry"}</p>
        <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-4">Mood breakdown</p>
          <div className="space-y-3">
            {Object.entries(dayMoodCounts).sort((a, b) => b[1] - a[1]).map(([mood, count]) => {
              const c = getMoodColor(mood);
              const pct = Math.round((count / dayTotal) * 100);
              return (
                <div key={mood}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium flex items-center gap-2 ${c.label}`}>{MOOD_EMOJIS[mood] || "😐"} {mood}</span>
                    <span className="text-slate-600 text-xs">{pct}%</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.line, transition: "width 0.8s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <span className="text-2xl">{MOOD_EMOJIS[entry.mood] || "😐"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-sm leading-relaxed">{entry.preview}</p>
                <p className="text-slate-600 text-xs mt-1">{formatTime(entry.timestamp)}</p>
              </div>
              <MoodBadge mood={entry.mood} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-2xl font-bold font-serif text-white mb-1">Mood History</h2>
      <p className="text-slate-500 text-sm mb-6" style={{ fontWeight: 300 }}>A reflection of your emotional journey</p>

      {history.length > 0 && (
        <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-4">Mood over time</p>
          <div style={{ overflowX: "auto" }}>
            <MoodLineGraph history={history} />
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            {[
              { mood: "happy", label: "Happy / Calm" },
              { mood: "okay", label: "Okay" },
              { mood: "anxious", label: "Anxious / Stressed" },
              { mood: "sad", label: "Sad / Low" },
            ].map(({ mood, label }) => (
              <div key={mood} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: getMoodColor(mood).dot, boxShadow: `0 0 6px ${getMoodColor(mood).dot}` }} />
                <span className="text-slate-600 text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {dayKeys.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🌱</p>
          <p className="text-slate-400">Your mood history will appear here</p>
          <p className="text-slate-600 text-sm mt-2" style={{ fontWeight: 300 }}>Start chatting to track your feelings</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dayKeys.map((day) => {
            const entries = dayGroups[day];
            const topMood = dominantMood(entries);
            const c = getMoodColor(topMood);
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className="text-left rounded-2xl p-4 transition-all duration-300"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(8px)" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = `${c.dot}50`; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-medium text-sm">{friendlyDay(day)}</p>
                    <p className="text-slate-600 text-xs mt-0.5">{entries.length} check-in{entries.length !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="text-2xl">{MOOD_EMOJIS[topMood] || "😐"}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[...new Set(entries.map((e) => e.mood))].map((mood) => <MoodBadge key={mood} mood={mood} />)}
                </div>
                <p className="text-slate-700 text-xs">Tap to see details →</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main Home ─────────────────────────────────────────────────
export default function Home({ onNavigate }) {
  const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  const [allMessages, setAllMessages] = useState([]);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeView, setActiveView] = useState("chat");
  const [chatOpen, setChatOpen] = useState(false);
  const [greeting, setGreeting] = useState(getGreeting());
  const bottomRef = useRef(null);

  useEffect(() => { const token = localStorage.getItem("token"); if (!token) onNavigate("landing"); }, []);
  useEffect(() => { const id = setInterval(() => setGreeting(getGreeting()), 60_000); return () => clearInterval(id); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  useEffect(() => {
    if (!chatOpen) return;
    const poll = async () => {
      const token = localStorage.getItem("token");
      const today = new Date().toISOString().split("T")[0];
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/poll?date=${today}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.newMessages?.length) {
          const newMsgs = data.newMessages.map((m) => ({ id: m.id, role: m.role, content: m.message, timestamp: new Date(m.created_at).getTime() }));
          setMessages((prev) => { const ids = new Set(prev.map((m) => m.id)); return [...prev, ...newMsgs.filter((m) => !ids.has(m.id))]; });
        }
      } catch {}
    };
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [chatOpen]);

  const openChat = () => {
    const welcome = { id: Date.now(), role: "assistant", timestamp: Date.now(), content: `${greeting}, ${user?.name?.split(" ")[0] || "there"} 🌙 How are you feeling right now?` };
    setChatOpen(true); setMessages([welcome]); setAllMessages((prev) => [...prev, welcome]);
  };
  const openDayChat = (_day, msgs) => { setChatOpen(true); setMessages(msgs); };

  const handleSend = async (text) => {
    const token = localStorage.getItem("token");
    const userMsg = { id: Date.now(), role: "user", content: text, mood: "neutral", timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]); setAllMessages((prev) => [...prev, userMsg]); setIsTyping(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/morning-checkin?fast=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = { id: Date.now() + 1, role: "assistant", content: data.error || "Something went wrong 😔", timestamp: Date.now() };
        setMessages((prev) => [...prev, err]); setAllMessages((prev) => [...prev, err]); return;
      }
      const mood = data.mood?.mood_label || "neutral";
      const updater = (prev) => prev.map((m) => (m.id === userMsg.id ? { ...m, mood } : m));
      setMessages(updater); setAllMessages(updater);
      setHistory((prev) => [{ id: Date.now(), mood, preview: text, timestamp: Date.now() }, ...prev]);
      const aiMsg = { id: Date.now() + 1, role: "assistant", content: data.reply, timestamp: Date.now() };
      setMessages((prev) => [...prev, aiMsg]); setAllMessages((prev) => [...prev, aiMsg]);
    } catch {
      const err = { id: Date.now() + 1, role: "assistant", content: "I couldn't connect 😔 Please try again.", timestamp: Date.now() };
      setMessages((prev) => [...prev, err]); setAllMessages((prev) => [...prev, err]);
    } finally { setIsTyping(false); }
  };

  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); onNavigate("landing"); };

  const totalCheckins = history.length;
  const weekCheckins = history.filter((e) => Date.now() - e.timestamp < 7 * 86_400_000).length;
  const topMood = totalCheckins ? Object.entries(history.reduce((a, e) => { a[e.mood] = (a[e.mood] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1])[0][0] : "—";

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{
        // Subtle dark gradient — drop in a bg image here later via backgroundImage
        background: "radial-gradient(ellipse at 20% 50%, rgba(30,20,60,0.9) 0%, rgba(8,12,25,1) 70%)",
      }}
    >
      <Sidebar user={user} allMessages={allMessages} activeView={activeView} setActiveView={setActiveView} onResetChat={() => setChatOpen(false)} onOpenDayChat={openDayChat} />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,12,25,0.6)", backdropFilter: "blur(16px)" }}
        >
          <div className="flex items-center gap-3">
            {chatOpen && activeView === "chat" && (
              <button
                onClick={() => setChatOpen(false)}
                className="p-1.5 rounded-xl transition-all text-slate-600"
                onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "transparent"; }}
              >
                ←
              </button>
            )}
            <div>
              <h1 className="text-white font-semibold font-serif text-sm">
                {activeView === "history" ? "Mood History" : chatOpen ? "Chat with Mendi" : "Dashboard"}
              </h1>
              <p className="text-slate-600 text-xs">
                {activeView === "history" ? `${history.length} entries` : chatOpen ? "Your companion is here 🌙" : `Welcome back, ${user?.name?.split(" ")[0] || "there"}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-xs text-slate-500">Today:</span>
                <span>{MOOD_EMOJIS[history[0]?.mood] || "😐"}</span>
                <MoodBadge mood={history[0]?.mood} />
              </div>
            )}
            <button
              onClick={handleLogout}
              className="mendi-btn mendi-btn-red mendi-btn-sm"
            >
              <span>Sign out</span>
            </button>
          </div>
        </header>

        {/* Content */}
        {activeView === "history" ? (
          <MoodHistoryView history={history} />
        ) : !chatOpen ? (
          <div className="flex-1 overflow-y-auto px-6 py-10">
            <div className="max-w-xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold font-serif text-white mb-2">
                  {greeting},{" "}
                  <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right,#fbbf24,#fb7185)" }}>
                    {user?.name?.split(" ")[0] || "there"}
                  </span>{" "}🌙
                </h2>
                <p className="text-slate-500" style={{ fontWeight: 300 }}>How are you doing today? Mendi is here whenever you're ready.</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { label: "Check-ins", value: totalCheckins, icon: "💬" },
                  { label: "This week", value: weekCheckins, icon: "📅" },
                  { label: "Top mood", value: topMood, icon: "✨" },
                ].map(({ label, value, icon }) => (
                  <div
                    key={label}
                    className="rounded-2xl p-4 text-center"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}
                  >
                    <p className="text-xl mb-1">{icon}</p>
                    <p className="text-white font-bold text-lg">{value}</p>
                    <p className="text-slate-600 text-xs mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mb-8">
                <button onClick={openChat} className="mendi-btn mendi-btn-amber mendi-btn-xl">
                  <span>🌙 Talk to Mendi →</span>
                </button>
              </div>

              {history.length > 0 ? (
                <div>
                  <p className="text-slate-600 text-xs font-medium uppercase tracking-wider mb-3">Recent check-ins</p>
                  <div className="space-y-2">
                    {history.slice(0, 4).map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-xl px-4 py-3 flex items-center gap-3"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}
                      >
                        <span className="text-lg">{MOOD_EMOJIS[entry.mood] || "😐"}</span>
                        <p className="text-slate-400 text-sm flex-1 truncate" style={{ fontWeight: 300 }}>{entry.preview}</p>
                        <MoodBadge mood={entry.mood} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 rounded-2xl" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
                  <p className="text-4xl mb-3">🌱</p>
                  <p className="text-slate-500 text-sm" style={{ fontWeight: 300 }}>Your mood history will appear here after your first check-in</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {messages.map((msg) => <ChatBubble key={msg.id} msg={msg} />)}
              {isTyping && (
                <div className="flex justify-start mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0" style={{ background: "linear-gradient(135deg,#fbbf24,#fb7185)" }}>🌙</div>
                  <div className="px-4 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
                    <div className="flex gap-1 items-center h-4">
                      {[0, 150, 300].map((d) => <span key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#64748b", animationDelay: `${d}ms` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <InputBar onSend={handleSend} isTyping={isTyping} />
          </>
        )}
      </main>
    </div>
  );
}