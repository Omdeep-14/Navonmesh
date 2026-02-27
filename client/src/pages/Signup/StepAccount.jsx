const StepAccount = ({ form, error, onChange, onNext, onNavigate }) => (
  <form onSubmit={onNext} className="space-y-5">
    <div>
      <label className="block text-slate-300 text-sm font-medium mb-2">Your name</label>
      <input
        type="text"
        name="name"
        value={form.name}
        onChange={onChange}
        placeholder="What should I call you?"
        className="w-full bg-slate-700 border border-slate-600 rounded-2xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
      />
    </div>
    <div>
      <label className="block text-slate-300 text-sm font-medium mb-2">Email address</label>
      <input
        type="email"
        name="email"
        value={form.email}
        onChange={onChange}
        placeholder="you@example.com"
        className="w-full bg-slate-700 border border-slate-600 rounded-2xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
      />
    </div>
    <div>
      <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
      <input
        type="password"
        name="password"
        value={form.password}
        onChange={onChange}
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
);

export default StepAccount;