import { useState } from "react";
import FloatingOrb from "../../components/shared/FloatingOrb";

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
            <span className="text-2xl font-bold font-serif text-amber-300">Mendi</span>
          </button>
          <h1 className="text-3xl font-bold font-serif text-white mb-2">Welcome back</h1>
          <p className="text-slate-400 text-sm">Your companion has been waiting for you</p>
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

export default Login;