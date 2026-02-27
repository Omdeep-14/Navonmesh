import FeatureCard from "./FeatureCard";

const FeaturesSection = () => (
  <section className="relative z-10 max-w-6xl mx-auto px-8 pb-32">
    <h2 className="text-4xl font-bold font-serif text-center text-white mb-4">
      More than a chatbot
    </h2>
    <p className="text-slate-400 text-center mb-16 max-w-xl mx-auto">
      Mendi doesn't wait for you to come to it. It reaches out, remembers, and cares.
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
);

export default FeaturesSection;