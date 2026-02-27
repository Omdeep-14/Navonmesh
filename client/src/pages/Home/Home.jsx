import { useState, useEffect, useRef } from "react";
import FloatingOrb from "../../components/shared/FloatingOrb";

// ── Constants ─────────────────────────────────────────────────
const MOOD_COLORS = {
  happy: { bg: "bg-amber-400/20", text: "text-amber-300", dot: "bg-amber-400" },
  sad: { bg: "bg-blue-400/20", text: "text-blue-300", dot: "bg-blue-400" },
  anxious: { bg: "bg-rose-400/20", text: "text-rose-300", dot: "bg-rose-400" },
  calm: {
    bg: "bg-emerald-400/20",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  angry: { bg: "bg-red-400/20", text: "text-red-300", dot: "bg-red-400" },
  neutral: {
    bg: "bg-slate-400/20",
    text: "text-slate-300",
    dot: "bg-slate-400",
  },
  stressed: {
    bg: "bg-orange-400/20",
    text: "text-orange-300",
    dot: "bg-orange-400",
  },
  okay: { bg: "bg-slate-400/20", text: "text-slate-300", dot: "bg-slate-400" },
};

const MOOD_EMOJIS = {
  happy: "😊",
  sad: "😢",
  anxious: "😰",
  calm: "🌿",
  angry: "😤",
  neutral: "😐",
  stressed: "😩",
  okay: "🙂",
};

// ── Helpers ───────────────────────────────────────────────────
const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const friendlyDay = (dateStr) => {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  const d = new Date(dateStr).toDateString();
  if (d === today) return "Today";
  if (d === yesterday) return "Yesterday";
  return new Date(dateStr).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
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
  items.forEach((m) => {
    const day = new Date(m.timestamp).toDateString();
    if (!groups[day]) groups[day] = [];
    groups[day].push(m);
  });
  return groups;
};

const dominantMood = (items) => {
  if (!items?.length) return "neutral";
  const counts = items.reduce((a, e) => {
    a[e.mood] = (a[e.mood] || 0) + 1;
    return a;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
};

// ── Small reusable components ─────────────────────────────────
const MoodBadge = ({ mood }) => {
  const c = MOOD_COLORS[mood] || MOOD_COLORS.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {mood}
    </span>
  );
};

const ChatBubble = ({ msg }) => {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center text-sm mr-2 mt-1 flex-shrink-0">
          🌙
        </div>
      )}
      <div
        className={`max-w-xs lg:max-w-sm flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}
      >
        {msg.mood && isUser && (
          <div className="flex justify-end">
            <MoodBadge mood={msg.mood} />
          </div>
        )}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-gradient-to-br from-amber-500 to-rose-500 text-white rounded-tr-sm"
              : "bg-slate-700/80 text-slate-200 rounded-tl-sm"
          }`}
        >
          {msg.content}
        </div>
        <span className="text-slate-600 text-xs">
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
};

// ── Sidebar ───────────────────────────────────────────────────
const Sidebar = ({
  user,
  allMessages,
  activeView,
  setActiveView,
  onResetChat,
  onOpenDayChat,
}) => {
  const dayGroups = groupByDay(allMessages);
  const dayKeys = Object.keys(dayGroups).sort(
    (a, b) => new Date(b) - new Date(a),
  );

  return (
    <aside className="w-72 flex-shrink-0 bg-slate-900/80 border-r border-slate-700/50 flex flex-col h-full">
      <div className="px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🌙</span>
          <span className="text-lg font-bold font-serif text-amber-300">
            Mendi
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center text-sm font-bold text-slate-900">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-white text-sm font-medium">
              {user?.name || "You"}
            </p>
            <p className="text-slate-500 text-xs">{user?.city || ""}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-b border-slate-700/50">
        {[
          { id: "chat", icon: "💬", label: "Chat with Mendi" },
          { id: "history", icon: "📅", label: "Mood History" },
        ].map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => {
              setActiveView(id);
              if (id === "chat") onResetChat();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 ${
              activeView === id
                ? "bg-amber-400/15 text-amber-300 border border-amber-400/20"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-slate-600 text-xs font-medium uppercase tracking-wider mb-3">
          Sessions
        </p>
        {dayKeys.length === 0 ? (
          <p className="text-slate-600 text-sm text-center mt-8">
            No sessions yet 🌱
          </p>
        ) : (
          <div className="space-y-1.5">
            {dayKeys.map((day) => {
              const msgs = dayGroups[day];
              const userMsgs = msgs.filter((m) => m.role === "user");
              const mood = dominantMood(userMsgs);
              const preview = userMsgs[0]?.content || "Session";
              return (
                <button
                  key={day}
                  onClick={() => {
                    onOpenDayChat(day, msgs);
                    setActiveView("chat");
                  }}
                  className="w-full text-left px-3 py-3 rounded-xl hover:bg-slate-700/50 transition-colors group border border-transparent hover:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400 text-xs font-medium group-hover:text-white transition-colors">
                      {friendlyDay(day)}
                    </span>
                    <span className="text-base">
                      {MOOD_EMOJIS[mood] || "😐"}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs truncate group-hover:text-slate-300 transition-colors">
                    {preview}
                  </p>
                  <p className="text-slate-700 text-xs mt-0.5">
                    {userMsgs.length} message{userMsgs.length !== 1 ? "s" : ""}
                  </p>
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
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef(null);
  const previewRef = useRef(null);
  const recognitionRef = useRef(null);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      setText(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setMediaStream(stream);
      setShowVideo(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      alert("Camera/mic access denied.");
    }
  };

  const startRecording = () => {
    if (!mediaStream) return;
    const recorder = new MediaRecorder(mediaStream);
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      setVideoBlob(blob);
      if (previewRef.current)
        previewRef.current.src = URL.createObjectURL(blob);
    };
    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
    mediaStream?.getTracks().forEach((t) => t.stop());
    setMediaStream(null);
  };

  const discardVideo = () => {
    setVideoBlob(null);
    setShowVideo(false);
    setIsRecording(false);
    mediaStream?.getTracks().forEach((t) => t.stop());
    setMediaStream(null);
  };

  const sendVideo = () => {
    if (!videoBlob) return;
    onSend("[Video message sent 🎥]");
    discardVideo();
  };

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-700/50 bg-slate-900/80 p-4">
      {showVideo && (
        <div className="mb-4 bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
          {!videoBlob ? (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full max-h-48 object-cover"
                muted
              />
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="px-4 py-2 bg-rose-500 text-white rounded-full text-sm font-medium flex items-center gap-2"
                  >
                    <span className="w-2 h-2 bg-white rounded-full" /> Record
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="px-4 py-2 bg-slate-700 text-white rounded-full text-sm font-medium flex items-center gap-2"
                  >
                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />{" "}
                    Stop
                  </button>
                )}
                <button
                  onClick={discardVideo}
                  className="px-4 py-2 bg-slate-700/80 text-slate-300 rounded-full text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <video
                ref={previewRef}
                controls
                className="w-full max-h-40 rounded-xl mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={sendVideo}
                  className="flex-1 py-2 bg-gradient-to-r from-amber-400 to-rose-400 text-slate-900 rounded-xl font-semibold text-sm"
                >
                  Send Video
                </button>
                <button
                  onClick={discardVideo}
                  className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl text-sm"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-end gap-3">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${isListening ? "bg-rose-500 text-white animate-pulse" : "bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600"}`}
        >
          🎙️
        </button>
        <button
          onClick={showVideo ? discardVideo : startVideo}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${showVideo ? "bg-rose-500 text-white" : "bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600"}`}
        >
          🎥
        </button>
        <div className="flex-1 relative">
          {isListening && (
            <div className="absolute -top-7 left-0 flex items-center gap-1.5 text-rose-400 text-xs">
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-ping" />{" "}
              Listening...
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Share how you're feeling..."
            rows={1}
            className="w-full bg-slate-700/80 border border-slate-600 rounded-2xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30 transition-colors resize-none"
            style={{ minHeight: "44px", maxHeight: "120px" }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!text.trim() || isTyping}
          className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center text-slate-900 font-bold flex-shrink-0 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
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
  const dayKeys = Object.keys(dayGroups).sort(
    (a, b) => new Date(b) - new Date(a),
  );
  const total = history.length;
  const moodCounts = history.reduce((acc, e) => {
    acc[e.mood] = (acc[e.mood] || 0) + 1;
    return acc;
  }, {});

  if (selectedDay) {
    const entries = dayGroups[selectedDay] || [];
    const dayMoodCounts = entries.reduce((acc, e) => {
      acc[e.mood] = (acc[e.mood] || 0) + 1;
      return acc;
    }, {});
    const dayTotal = entries.length;
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <button
          onClick={() => setSelectedDay(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-6"
        >
          ← Back to all days
        </button>
        <h2 className="text-2xl font-bold font-serif text-white mb-1">
          {friendlyDay(selectedDay)}
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          {entries.length} mood {entries.length !== 1 ? "entries" : "entry"}
        </p>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-6">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-4">
            Mood breakdown
          </p>
          <div className="space-y-3">
            {Object.entries(dayMoodCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([mood, count]) => {
                const c = MOOD_COLORS[mood] || MOOD_COLORS.neutral;
                const pct = Math.round((count / dayTotal) * 100);
                return (
                  <div key={mood}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-medium flex items-center gap-2 ${c.text}`}
                      >
                        {MOOD_EMOJIS[mood] || "😐"} {mood}
                      </span>
                      <span className="text-slate-500 text-xs">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${c.dot}`}
                        style={{
                          width: `${pct}%`,
                          transition: "width 0.8s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 flex items-start gap-3"
            >
              <span className="text-2xl">
                {MOOD_EMOJIS[entry.mood] || "😐"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-sm leading-relaxed">
                  {entry.preview}
                </p>
                <p className="text-slate-600 text-xs mt-1">
                  {formatTime(entry.timestamp)}
                </p>
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
      <h2 className="text-2xl font-bold font-serif text-white mb-1">
        Mood History
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        A reflection of your emotional journey
      </p>

      {total > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-6">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-4">
            Overall mood breakdown
          </p>
          <div className="space-y-3">
            {Object.entries(moodCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([mood, count]) => {
                const c = MOOD_COLORS[mood] || MOOD_COLORS.neutral;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={mood}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-medium flex items-center gap-2 ${c.text}`}
                      >
                        {MOOD_EMOJIS[mood] || "😐"} {mood}
                      </span>
                      <span className="text-slate-500 text-xs">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${c.dot}`}
                        style={{
                          width: `${pct}%`,
                          transition: "width 0.8s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {dayKeys.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🌱</p>
          <p className="text-slate-400">Your mood history will appear here</p>
          <p className="text-slate-600 text-sm mt-2">
            Start chatting to track your feelings
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dayKeys.map((day) => {
            const entries = dayGroups[day];
            const topMood = dominantMood(entries);
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className="text-left bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 hover:border-amber-400/30 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-medium text-sm">
                      {friendlyDay(day)}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {entries.length} check-in{entries.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-2xl">
                    {MOOD_EMOJIS[topMood] || "😐"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[...new Set(entries.map((e) => e.mood))].map((mood) => (
                    <MoodBadge key={mood} mood={mood} />
                  ))}
                </div>
                <p className="text-slate-600 text-xs">Tap to see details →</p>
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
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  const [allMessages, setAllMessages] = useState([]);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeView, setActiveView] = useState("chat");
  const [chatOpen, setChatOpen] = useState(false);
  const [greeting, setGreeting] = useState(getGreeting());
  const bottomRef = useRef(null);

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) onNavigate("landing");
  }, []);

  // Keep greeting in sync
  useEffect(() => {
    const id = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const openChat = () => {
    const welcomeMsg = {
      id: Date.now(),
      role: "assistant",
      timestamp: Date.now(),
      content: `${greeting}, ${user?.name?.split(" ")[0] || "there"} 🌙 How are you feeling right now?`,
    };
    setChatOpen(true);
    setMessages([welcomeMsg]);
    setAllMessages((prev) => [...prev, welcomeMsg]);
  };

  const openDayChat = (_day, msgs) => {
    setChatOpen(true);
    setMessages(msgs);
  };

  // ── THE REAL handleSend — calls your backend ──
  const handleSend = async (text) => {
    const token = localStorage.getItem("token");

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: text,
      mood: "neutral",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setAllMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/morning-checkin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: text }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        const aiMsg = {
          id: Date.now() + 1,
          role: "assistant",
          content: data.error || "Something went wrong 😔",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setAllMessages((prev) => [...prev, aiMsg]);
        return;
      }

      const mood = data.mood?.mood_label || "neutral";

      // update mood badge on user message
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsg.id ? { ...m, mood } : m)),
      );
      setAllMessages((prev) =>
        prev.map((m) => (m.id === userMsg.id ? { ...m, mood } : m)),
      );
      setHistory((prev) => [
        { id: Date.now(), mood, preview: text, timestamp: Date.now() },
        ...prev,
      ]);

      const aiMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setAllMessages((prev) => [...prev, aiMsg]);
    } catch {
      const aiMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: "I couldn't connect to the server 😔 Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setAllMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    onNavigate("landing");
  };

  const totalCheckins = history.length;
  const weekCheckins = history.filter(
    (e) => Date.now() - e.timestamp < 7 * 86_400_000,
  ).length;
  const topMood = totalCheckins
    ? Object.entries(
        history.reduce((a, e) => {
          a[e.mood] = (a[e.mood] || 0) + 1;
          return a;
        }, {}),
      ).sort((a, b) => b[1] - a[1])[0][0]
    : "—";

  return (
    <div className="h-screen bg-slate-900 flex overflow-hidden">
      <FloatingOrb className="w-96 h-96 bg-amber-500/10 top-0 -left-48 pointer-events-none" />
      <FloatingOrb className="w-64 h-64 bg-rose-500/10 bottom-0 right-0 pointer-events-none" />

      <Sidebar
        user={user}
        allMessages={allMessages}
        activeView={activeView}
        setActiveView={setActiveView}
        onResetChat={() => setChatOpen(false)}
        onOpenDayChat={openDayChat}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-900/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            {chatOpen && activeView === "chat" && (
              <button
                onClick={() => setChatOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1.5 rounded-xl hover:bg-slate-700/50"
              >
                ←
              </button>
            )}
            <div>
              <h1 className="text-white font-semibold font-serif">
                {activeView === "history"
                  ? "Mood History"
                  : chatOpen
                    ? "Chat with Mendi"
                    : "Dashboard"}
              </h1>
              <p className="text-slate-500 text-xs">
                {activeView === "history"
                  ? `${history.length} entries logged`
                  : chatOpen
                    ? "Your personal companion is here 🌙"
                    : `Welcome back, ${user?.name?.split(" ")[0] || "there"}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-full px-3 py-1.5">
                <span className="text-xs text-slate-400">Today:</span>
                <span className="text-base">
                  {MOOD_EMOJIS[history[0]?.mood] || "😐"}
                </span>
                <MoodBadge mood={history[0]?.mood} />
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-slate-300 text-xs transition-colors px-3 py-1.5 rounded-full hover:bg-slate-700/50"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Content */}
        {activeView === "history" ? (
          <MoodHistoryView history={history} />
        ) : !chatOpen ? (
          <div className="flex-1 overflow-y-auto px-6 py-10">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold font-serif text-white mb-2">
                  {greeting},{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-rose-300">
                    {user?.name?.split(" ")[0] || "there"}
                  </span>{" "}
                  🌙
                </h2>
                <p className="text-slate-400">
                  How are you doing today? Mendi is here whenever you're ready.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: "Check-ins", value: totalCheckins, icon: "💬" },
                  { label: "This week", value: weekCheckins, icon: "📅" },
                  { label: "Top mood", value: topMood, icon: "✨" },
                ].map(({ label, value, icon }) => (
                  <div
                    key={label}
                    className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 text-center"
                  >
                    <p className="text-2xl mb-1">{icon}</p>
                    <p className="text-white font-bold text-xl">{value}</p>
                    <p className="text-slate-500 text-xs mt-1">{label}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mb-10">
                <button
                  onClick={openChat}
                  className="group bg-gradient-to-r from-amber-400 to-rose-400 text-slate-900 px-10 py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-lg shadow-amber-500/20"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-2xl">🌙</span>
                    Talk to Mendi
                    <span className="text-xl transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </button>
              </div>

              {history.length > 0 ? (
                <div>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-3">
                    Recent check-ins
                  </p>
                  <div className="space-y-2">
                    {history.slice(0, 4).map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-3 flex items-center gap-3"
                      >
                        <span className="text-xl">
                          {MOOD_EMOJIS[entry.mood] || "😐"}
                        </span>
                        <p className="text-slate-300 text-sm flex-1 truncate">
                          {entry.preview}
                        </p>
                        <MoodBadge mood={entry.mood} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-slate-700 rounded-2xl">
                  <p className="text-4xl mb-3">🌱</p>
                  <p className="text-slate-400 text-sm">
                    Your mood history will appear here after your first check-in
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {messages.map((msg) => (
                <ChatBubble key={msg.id} msg={msg} />
              ))}
              {isTyping && (
                <div className="flex justify-start mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center text-sm mr-2 flex-shrink-0">
                    🌙
                  </div>
                  <div className="bg-slate-700/80 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1 items-center h-4">
                      <span
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
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
