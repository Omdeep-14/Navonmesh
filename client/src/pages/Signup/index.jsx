import { useState } from "react";
import FloatingOrb from "../../components/shared/FloatingOrb";
import StepIndicator from "./StepIndicator";
import StepAccount from "./StepAccount";
import StepAbout from "./StepAbout";
import StepLocation from "./StepLocation";

function Signup({ onNavigate }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    city: "",
    area: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const nextStep = (e) => {
    e.preventDefault();
    if (step === 0) {
      if (!form.name || !form.email || !form.password) {
        setError("Please fill in all fields");
        return;
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }
    if (step === 1) {
      if (!form.age) {
        setError("Please enter your age");
        return;
      }
    }
    setError("");
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.city) {
      setError("Please enter your city");
      return;
    }
    setLoading(true);
    setError("");
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, timezone, age: parseInt(form.age) }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/home";
    } catch {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      <FloatingOrb className="w-96 h-96 bg-indigo-500 -top-48 right-0" />
      <FloatingOrb className="w-72 h-72 bg-amber-500 bottom-0 -left-32" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <button
            onClick={() => onNavigate("landing")}
            className="inline-flex items-center gap-2 mb-6"
          >
            <span className="text-3xl">🌙</span>
            <span className="text-2xl font-bold font-serif text-amber-300">
              Mendi
            </span>
          </button>
          <h1 className="text-3xl font-bold font-serif text-white mb-2">
            Let's get you set up
          </h1>
          <p className="text-slate-400 text-sm">
            Your companion is ready to meet you
          </p>
        </div>

        <StepIndicator currentStep={step} />

        <div className="bg-slate-800 bg-opacity-80 border border-slate-700 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
          {step === 0 && (
            <StepAccount
              form={form}
              error={error}
              onChange={handleChange}
              onNext={nextStep}
              onNavigate={onNavigate}
            />
          )}
          {step === 1 && (
            <StepAbout
              form={form}
              error={error}
              onChange={handleChange}
              onNext={nextStep}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <StepLocation
              form={form}
              error={error}
              loading={loading}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onBack={() => setStep(1)}
            />
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-8">
          Your conversations are private and secure 🔒
        </p>
      </div>
    </div>
  );
}

export default Signup;
