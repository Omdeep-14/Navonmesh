const CTASection = ({ onNavigate }) => (
  <section className="relative z-10 max-w-3xl mx-auto px-8 pb-32 text-center">
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-16">
      <p className="text-5xl mb-6">🌙</p>
      <h2 className="text-4xl font-bold font-serif text-white mb-4">
        You deserve someone in your corner
      </h2>
      <p className="text-slate-400 mb-8 leading-relaxed">
        Start each day with a companion that remembers, checks in, and actually cares about
        how you're doing.
      </p>
      <button
        onClick={() => onNavigate("signup")}
        className="inline-block bg-gradient-to-r from-amber-400 to-rose-400 text-slate-900 px-12 py-4 rounded-full text-lg font-bold hover:opacity-90 transition-opacity"
      >
        Begin for free →
      </button>
    </div>
  </section>
);

export default CTASection;