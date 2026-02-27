import FloatingOrb from "../../components/shared/FloatingOrb";
import HeroSection from "./HeroSection";
import ChatPreview from "./ChatPreview";
import FeaturesSection from "./FeaturesSection";
import TestimonialsSection from "./TestimonialsSection";
import CTASection from "./CTASection";

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
          <span className="text-xl font-bold font-serif text-amber-300">Mendi</span>
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

      <HeroSection onNavigate={onNavigate} />
      <ChatPreview />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection onNavigate={onNavigate} />

      <footer className="relative z-10 text-center pb-12 text-slate-600 text-sm">
        <p>Made with 💛 at the hackathon · Mendi 2024</p>
      </footer>
    </div>
  );
}

export default Landing;