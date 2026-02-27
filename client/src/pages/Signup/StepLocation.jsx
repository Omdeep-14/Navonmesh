const StepLocation = ({ form, error, loading, onChange, onSubmit, onBack }) => (
  <form onSubmit={onSubmit} className="space-y-5">
    <div className="text-center mb-6">
      <p className="text-5xl mb-3">📍</p>
      <p className="text-slate-300 text-sm">
        So I can suggest nearby parks or restaurants when you need a break.
      </p>
    </div>
    <div>
      <label className="block text-slate-300 text-sm font-medium mb-2">City</label>
      <input
        type="text"
        name="city"
        value={form.city}
        onChange={onChange}
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
        onChange={onChange}
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
        onClick={onBack}
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
);

export default StepLocation;