const FeatureCard = ({ emoji, title, desc }) => (
  <div className="bg-slate-800 bg-opacity-60 border border-slate-700 rounded-3xl p-8 hover:border-amber-400 hover:border-opacity-50 transition-all duration-500 hover:-translate-y-1">
    <div className="text-4xl mb-4">{emoji}</div>
    <h3 className="text-white font-semibold text-xl mb-3 font-serif">{title}</h3>
    <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
  </div>
);

export default FeatureCard;