import { useState } from "react";
import SahaayLogo from "../../components/shared/SahaayLogo";

function Login({ onNavigate }) {
  const baseurl = import.meta.env.VITE_API_URL;
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
      const res = await fetch(`${baseurl}/api/v1/auth/login`, {
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
    <div
      className="min-h-screen flex flex-col items-center justify-start"
      style={{ position: "relative" }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(8,12,25,0.65)",
          zIndex: 1,
        }}
      />

      {/* Header */}
      <div
        className="w-full text-center pt-10 pb-4"
        style={{ position: "relative", zIndex: 10 }}
      >
        <button
          onClick={() => onNavigate("landing")}
          className="inline-flex items-center gap-2 mb-2"
        >
          <SahaayLogo size={40} />
          <span className="text-2xl font-bold font-serif text-amber-300">
            Sahaay
          </span>
        </button>
        <h1 className="text-4xl font-bold text-white mt-2">
          Welcome to{" "}
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(to right, #fbbf24, #fb7185)",
            }}
          >
            Sahaay
          </span>
        </h1>
        <p className="text-slate-400 text-sm mt-1" style={{ fontWeight: 300 }}>
          Your AI-powered mental wellness companion
        </p>
      </div>

      {/* Glass card */}
      <div
        className="glass-card"
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "460px",
          margin: "1.5rem auto 2rem auto",
          padding: "2rem 2.25rem",
          boxSizing: "border-box",
        }}
      >
        {/* Tabs */}
        <div
          className="flex p-1 mb-6 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <button
            onClick={() => onNavigate("login")}
            style={{
              background: "transparent",
              border: "1.5px solid rgba(255,255,255,0.2)",
              borderRadius: "12px",
              padding: "8px 18px",
              color: "#e2e8f0",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              e.currentTarget.style.color = "#e2e8f0";
            }}
          >
            Sign in
          </button>
          <button
            className="glass-tab glass-tab-inactive"
            onClick={() => onNavigate("signup")}
            style={{ flex: 1, minWidth: 0 }}
          >
            Sign Up
          </button>
        </div>

        <h2 className="text-lg font-bold text-white mb-5">
          Sign in to your account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="glass-input"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              className="glass-input"
            />
          </div>
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-rose-300 text-sm"
              style={{
                background: "rgba(190,18,60,0.15)",
                border: "1px solid rgba(190,18,60,0.25)",
              }}
            >
              {error}
            </div>
          )}
          <div className="pt-1" style={{ width: "100%" }}>
            <button
              type="submit"
              disabled={loading}
              className="mendi-btn mendi-btn-amber mendi-btn-block"
              style={{
                justifyContent: "center",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <span>{loading ? "Signing you in..." : "Sign In →"}</span>
            </button>
          </div>
        </form>

        <p className="text-center text-slate-500 text-sm mt-5">
          Don't have an account?{" "}
          <button
            onClick={() => onNavigate("signup")}
            className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
          >
            Create one
          </button>
        </p>
      </div>

      <p
        className="text-slate-600 text-xs mb-6"
        style={{ position: "relative", zIndex: 10 }}
      >
        Your conversations are private and secure 🔒
      </p>
    </div>
  );
}

export default Login;
