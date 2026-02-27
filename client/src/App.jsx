import { useState } from "react";

// ============================================================
// SHARED
// ============================================================
const FloatingOrb = ({ className }) => (
  <div
    className={`absolute rounded-full blur-3xl opacity-20 animate-pulse ${className}`}
  />
);

// ============================================================
// LANDING PAGE
// ============================================================
const FeatureCard = ({ emoji, title, desc }) => (
  <div className="bg-slate-800 bg-opacity-60 border border-slate-700 rounded-3xl p-8 hover:border-amber-400 hover:border-opacity-50 transition-all duration-500 hover:-translate-y-1">
    <div className="text-4xl mb-4">{emoji}</div>
    <h3 className="text-white font-semibold text-xl mb-3 font-serif">
      {title}
    </h3>
    <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
  </div>
);

const TestimonialCard = ({ quote, name, mood }) => (
  <div className="bg-slate-800 bg-opacity-40 border border-slate-700 rounded-2xl p-6">
    <p className="text-slate-300 italic leading-relaxed mb-4 text-sm">
      "{quote}"
    </p>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center text-sm">
        {mood}
      </div>
      <span className="text-slate-400 text-sm">{name}</span>
    </div>
  </div>
);

function Landing({ onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden">
      <FloatingOrb className="w-96 h-96 bg-amber-500 top-0 -left-48" />
      <FloatingOrb className="w-80 h-80 bg-rose-500 top-32 right-0" />
      <FloatingOrb className="w-64 h-64 bg-indigo-500 bottom-64 left-1/3" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌙</span>
          <span className="text-xl font-bold font-serif text-amber-300">
            Mendi
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate("login")}
            className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
          >
            Sign in
          </button>
          <button
            onClick={() => onNavigate("signup")}
            className="bg-amber-400 text-slate-900 px-5 py-2 rounded-full text-sm font-semibold hover:bg-amber-300 transition-colors"
          >
            Get started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 bg-slate-800 bg-opacity-80 border border-slate-700 rounded-full px-4 py-2 text-sm text-slate-300 mb-10">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Your companion is always here
        </div>

        <h1 className="text-6xl md:text-8xl font-bold font-serif leading-tight mb-6">
          <span className="text-white">Someone who</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-amber-300">
            actually listens
          </span>
        </h1>

        <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed mb-12">
          Mendi checks in with you in the morning, remembers your day, follows
          up on your meetings, and shows up again at night — like a friend who
          never forgets.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onNavigate("signup")}
            className="bg-gradient-to-r from-amber-400 to-rose-400 text-slate-900 px-10 py-4 rounded-full text-lg font-bold hover:opacity-90 transition-opacity shadow-lg"
          >
            Start your journey →
          </button>
          <button
            onClick={() => onNavigate("login")}
            className="text-slate-300 hover:text-white transition-colors text-lg underline underline-offset-4"
          >
            Already have an account
          </button>
        </div>
      </section>

      {/* Chat preview */}
      <section className="relative z-10 max-w-2xl mx-auto px-8 pb-32">
        <div className="bg-slate-800 bg-opacity-80 border border-slate-700 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center text-lg">
              🌙
            </div>
            <div>
              <p className="text-white font-medium text-sm">Mendi</p>
              <p className="text-green-400 text-xs">● Online</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-start">
              <div className="bg-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
                <p className="text-slate-200 text-sm">
                  Good morning Rahul ☀️ How are you feeling today?
                </p>
                <p className="text-slate-500 text-xs mt-1">8:00 AM</p>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-gradient-to-br from-amber-500 to-rose-500 rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs">
                <p className="text-white text-sm">
                  Pretty anxious... have a big presentation at 2pm 😬
                </p>
                <p className="text-amber-100 text-xs mt-1 opacity-70">
                  8:03 AM
                </p>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
                <p className="text-slate-200 text-sm">
                  That sounds nerve-wracking, but I know you've prepared for
                  this. I'll check in with you after 2pm to see how it went 💛
                </p>
                <p className="text-slate-500 text-xs mt-1">8:03 AM</p>
              </div>
            </div>
            <div className="flex justify-start opacity-60">
              <div className="bg-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
                <p className="text-slate-200 text-sm">
                  Hey, your presentation was at 2pm — how did it go? 🤞
                </p>
                <p className="text-slate-500 text-xs mt-1">4:00 PM</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-700">
            <div className="flex-1 bg-slate-700 rounded-full px-4 py-2 text-slate-500 text-sm">
              Type how you're feeling...
            </div>
            <button className="w-10 h-10 bg-gradient-to-br from-amber-400 to-rose-400 rounded-full flex items-center justify-center text-slate-900 font-bold">
              →
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 pb-32">
        <h2 className="text-4xl font-bold font-serif text-center text-white mb-4">
          More than a chatbot
        </h2>
        <p className="text-slate-400 text-center mb-16 max-w-xl mx-auto">
          Mendi doesn't wait for you to come to it. It reaches out, remembers,
          and cares.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            emoji="🌅"
            title="Morning check-ins"
            desc="Tell Mendi how you're feeling each morning. It listens, understands your mood, and sets the tone for your day."
          />
          <FeatureCard
            emoji="🔔"
            title="Proactive follow-ups"
            desc="Mention a stressful meeting? Mendi will automatically check back in after it ends — without you having to remember."
          />
          <FeatureCard
            emoji="🌙"
            title="Evening comfort"
            desc="If your day was rough, Mendi shows up at night with movie suggestions, music, or food delivery links to help you unwind."
          />
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 pb-32">
        <h2 className="text-3xl font-bold font-serif text-center text-white mb-12">
          What people say
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <TestimonialCard
            quote="It remembered my interview and texted me after. I cried. No app has ever felt that human."
            name="Priya, 24"
            mood="🌸"
          />
          <TestimonialCard
            quote="I told it I was anxious about a call at 3pm. At 5pm it asked how it went. That follow-up meant everything."
            name="Arjun, 28"
            mood="☀️"
          />
          <TestimonialCard
            quote="After a terrible day, Mendi suggested ordering from my favourite restaurant. I didn't know I needed that."
            name="Sneha, 22"
            mood="🌙"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-8 pb-32 text-center">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-16">
          <p className="text-5xl mb-6">🌙</p>
          <h2 className="text-4xl font-bold font-serif text-white mb-4">
            You deserve someone in your corner
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Start each day with a companion that remembers, checks in, and
            actually cares about how you're doing.
          </p>
          <button
            onClick={() => onNavigate("signup")}
            className="inline-block bg-gradient-to-r from-amber-400 to-rose-400 text-slate-900 px-12 py-4 rounded-full text-lg font-bold hover:opacity-90 transition-opacity"
          >
            Begin for free →
          </button>
        </div>
      </section>

      <footer className="relative z-10 text-center pb-12 text-slate-600 text-sm">
        <p>Made with 💛 at the hackathon · Mendi 2024</p>
      </footer>
    </div>
  );
}

// ============================================================
// LOGIN PAGE
// ============================================================
function Login({ onNavigate }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onNavigate("home");
    } catch {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      <FloatingOrb className="w-96 h-96 bg-amber-500 -top-32 -left-32" />
      <FloatingOrb className="w-72 h-72 bg-rose-500 bottom-0 right-0" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <button
            onClick={() => onNavigate("landing")}
            className="inline-flex items-center gap-2 mb-6"
          >
            <span className="text-3xl">🌙</span>
            <span className="text-2xl font-bold font-serif text-amber-300">
              Mendi
            </span>
          </button>
          <h1 className="text-3xl font-bold font-serif text-white mb-2">
            Welcome back
          </h1>
          <p className="text-slate-400 text-sm">
            Your companion has been waiting for you
          </p>
        </div>

        <div className="bg-slate-800 bg-opacity-80 border border-slate-700 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-2xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-2xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
              />
            </div>
            {error && (
              <div className="bg-rose-900 bg-opacity-40 border border-rose-700 rounded-2xl px-4 py-3 text-rose-300 text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-400 to-rose-400 text-slate-900 py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                  Signing you in...
                </span>
              ) : (
                "Sign in →"
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-700"></div>
            <span className="text-slate-500 text-xs">or</span>
            <div className="flex-1 h-px bg-slate-700"></div>
          </div>

          <p className="text-center text-slate-400 text-sm">
            Don't have an account?{" "}
            <button
              onClick={() => onNavigate("signup")}
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Create one
            </button>
          </p>
        </div>

        <p className="text-center text-slate-600 text-xs mt-8">
          Your conversations are private and secure 🔒
        </p>
      </div>
    </div>
  );
}

// ============================================================
// SIGNUP PAGE
// ============================================================
const signupSteps = ["Account", "About you", "Location"];

function Signup({ onNavigate }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    city: "",
    area: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const nextStep = (e) => {
    e.preventDefault();
    if (step === 0) {
      if (!form.name || !form.email || !form.password) {
        setError("Please fill in all fields");
        return;
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }
    if (step === 1) {
      if (!form.age) {
        setError("Please enter your age");
        return;
      }
    }
    setError("");
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.city) {
      setError("Please enter your city");
      return;
    }
    setLoading(true);
    setError("");
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const res = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, timezone, age: parseInt(form.age) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onNavigate("home");
    } catch {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      <FloatingOrb className="w-96 h-96 bg-indigo-500 -top-48 right-0" />
      <FloatingOrb className="w-72 h-72 bg-amber-500 bottom-0 -left-32" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <button
            onClick={() => onNavigate("landing")}
            className="inline-flex items-center gap-2 mb-6"
          >
            <span className="text-3xl">🌙</span>
            <span className="text-2xl font-bold font-serif text-amber-300">
              Mendi
            </span>
          </button>
          <h1 className="text-3xl font-bold font-serif text-white mb-2">
            Let's get you set up
          </h1>
          <p className="text-slate-400 text-sm">
            Your companion is ready to meet you
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {signupSteps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 ${i <= step ? "text-amber-400" : "text-slate-600"}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                    i < step
                      ? "bg-amber-400 border-amber-400 text-slate-900"
                      : i === step
                        ? "border-amber-400 text-amber-400"
                        : "border-slate-600 text-slate-600"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">{s}</span>
              </div>
              {i < signupSteps.length - 1 && (
                <div
                  className={`w-8 h-px ${i < step ? "bg-amber-400" : "bg-slate-600"} transition-colors duration-300`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-slate-800 bg-opacity-80 border border-slate-700 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
          {/* Step 0 */}
          {step === 0 && (
            <form onSubmit={nextStep} className="space-y-5">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Your name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="What should I call you?"
                  className="w-full bg-slate-700 border border-slate-600 rounded-2xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full bg-slate-700 border border-slate-600 rounded-2xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-700 border border-slate-600 rounded-2xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
              {error && (
                <div className="bg-rose-900 bg-opacity-40 border border-rose-700 rounded-2xl px-4 py-3 text-rose-300 text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-400 to-rose-400 text-slate-900 py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity"
              >
                Continue →
              </button>
              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-slate-700"></div>
                <span className="text-slate-500 text-xs">or</span>
                <div className="flex-1 h-px bg-slate-700"></div>
              </div>
              <p className="text-center text-slate-400 text-sm">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => onNavigate("login")}
                  className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <form onSubmit={nextStep} className="space-y-5">
              <div className="text-center mb-6">
                <p className="text-5xl mb-3">👋</p>
                <p className="text-slate-300 text-sm">
                  Nice to meet you,{" "}
                  <span className="text-amber-300 font-semibold">
                    {form.name}
                  </span>
                  ! Tell me a bit about yourself.
                </p>
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  How old are you?
                </label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="Your age"
                  min="5"
                  max="120"
                  className="w-full bg-slate-700 border border-slate-600 rounded-2xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
              {error && (
                <div className="bg-rose-900 bg-opacity-40 border border-rose-700 rounded-2xl px-4 py-3 text-rose-300 text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex-1 bg-slate-700 text-slate-300 py-3 rounded-2xl font-medium text-sm hover:bg-slate-600 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-400 to-rose-400 text-slate-900 py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Continue →
                </button>
              </div>
            </form>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center mb-6">
                <p className="text-5xl mb-3">📍</p>
                <p className="text-slate-300 text-sm">
                  So I can suggest nearby parks or restaurants when you need a
                  break.
                </p>
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai"
                  className="w-full bg-slate-700 border border-slate-600 rounded-2xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Area / Neighbourhood{" "}
                  <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  placeholder="e.g. Andheri West"
                  className="w-full bg-slate-700 border border-slate-600 rounded-2xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
              {error && (
                <div className="bg-rose-900 bg-opacity-40 border border-rose-700 rounded-2xl px-4 py-3 text-rose-300 text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-slate-700 text-slate-300 py-3 rounded-2xl font-medium text-sm hover:bg-slate-600 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-amber-400 to-rose-400 text-slate-900 py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                      Creating...
                    </span>
                  ) : (
                    "Start my journey 🌙"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-8">
          Your conversations are private and secure 🔒
        </p>
      </div>
    </div>
  );
}

// ============================================================
// PREVIEW WRAPPER — navigates between pages without react-router
// ============================================================
export default function Preview() {
  const [page, setPage] = useState("landing");

  return (
    <div>
      {/* Dev nav strip */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-slate-950 bg-opacity-90 py-2 border-b border-slate-800">
        <span className="text-slate-500 text-xs mr-2">Preview:</span>
        {["landing", "login", "signup"].map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              page === p
                ? "bg-amber-400 text-slate-900"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Page offset for strip */}
      <div className="pt-10">
        {page === "landing" && <Landing onNavigate={setPage} />}
        {page === "login" && <Login onNavigate={setPage} />}
        {page === "signup" && <Signup onNavigate={setPage} />}
      </div>
    </div>
  );
}
