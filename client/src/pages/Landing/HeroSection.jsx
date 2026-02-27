const HeroSection = ({ onNavigate }) => (
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
      Mendi checks in with you in the morning, remembers your day, follows up on your
      meetings, and shows up again at night — like a friend who never forgets.
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
);

export default HeroSection;