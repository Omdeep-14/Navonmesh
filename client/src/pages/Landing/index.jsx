import FloatingOrb from "../../components/shared/FloatingOrb";
import SahaayLogo from "../../components/shared/SahaayLogo";
import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";
import HowItWorksSection from "./HowItWorksSection";
import CTASection from "./CTASection";

function Landing({ onNavigate }) {
  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ position: "relative" }}>
      {/* Overlay on top of the persistent video in App.jsx */}
      <div style={{ position: "fixed", inset: 0, background: "rgba(8,12,25,0.62)", zIndex: 1 }} />

      <FloatingOrb className="w-96 h-96 bg-amber-500 top-0 -left-48" />
      <FloatingOrb className="w-80 h-80 bg-rose-500 top-32 right-0" />
      <FloatingOrb className="w-64 h-64 bg-indigo-500 bottom-64 left-1/3" />

      {/* Navbar */}
      <nav className="relative flex items-center justify-between px-8 py-6 max-w-6xl mx-auto" style={{ zIndex: 10 }}>
        <div className="flex items-center gap-2">
          <SahaayLogo size={36} />
          <span className="text-xl font-bold font-serif text-amber-300">Sahaay</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("login")}
            className="mendi-btn mendi-btn-slate mendi-btn-sm"
          >
            <span>Sign in</span>
          </button>
          <button
            onClick={() => onNavigate("signup")}
            className="mendi-btn mendi-btn-amber mendi-btn-sm"
          >
            <span>Get started</span>
          </button>
        </div>
      </nav>

      <div style={{ position: "relative", zIndex: 10 }}>
        <HeroSection onNavigate={onNavigate} />
        <FeaturesSection onNavigate={onNavigate} />
        <HowItWorksSection onNavigate={onNavigate} />
        <CTASection onNavigate={onNavigate} />
        <footer className="text-center pb-12 text-slate-600 text-sm">
          <p>Made with 💛 at the hackathon · Sahaay 2024</p>
        </footer>
      </div>
    </div>
  );
}

export default Landing;