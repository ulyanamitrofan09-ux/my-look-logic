import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AuthGate } from "@/components/AuthGate";

export const Route = createFileRoute("/onboarding")({
  component: () => <AuthGate><Onboarding /></AuthGate>,
});

const COLORS = [
  { id: "warm", label: "Warm", desc: "Golden/olive skin, brown or green eyes", grad: "linear-gradient(135deg,#E8C39E,#B97A4A)" },
  { id: "cool", label: "Cool", desc: "Pink/porcelain skin, grey or blue eyes", grad: "linear-gradient(135deg,#E9D4DA,#7390B0)" },
  { id: "neutral", label: "Neutral", desc: "A mix of both", grad: "linear-gradient(135deg,#E8C39E,#7390B0)" },
];
const BODIES = ["Straight", "Hourglass", "Triangle", "Inverted Triangle", "Oval"];
const VIBES = ["Minimal", "Classic", "Trendy", "Romantic", "Business", "Casual"];

function Silhouette({ shape }: { shape: string }) {
  const s = { stroke: "currentColor", strokeWidth: 1.5, fill: "none" };
  switch (shape) {
    case "Hourglass":
      return <svg viewBox="0 0 40 60" className="w-10 h-14"><path d="M10 5 Q14 18 10 28 Q14 38 10 55 M30 5 Q26 18 30 28 Q26 38 30 55" {...s} /></svg>;
    case "Triangle":
      return <svg viewBox="0 0 40 60" className="w-10 h-14"><path d="M14 5 L14 28 L6 55 M26 5 L26 28 L34 55" {...s} /></svg>;
    case "Inverted Triangle":
      return <svg viewBox="0 0 40 60" className="w-10 h-14"><path d="M6 5 L14 28 L14 55 M34 5 L26 28 L26 55" {...s} /></svg>;
    case "Oval":
      return <svg viewBox="0 0 40 60" className="w-10 h-14"><path d="M12 5 Q6 30 12 55 M28 5 Q34 30 28 55" {...s} /></svg>;
    default:
      return <svg viewBox="0 0 40 60" className="w-10 h-14"><path d="M14 5 L14 55 M26 5 L26 55" {...s} /></svg>;
  }
}

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [color, setColor] = useState("");
  const [body, setBody] = useState("");
  const [vibes, setVibes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const toggleVibe = (v: string) => {
    setVibes((prev) => prev.includes(v) ? prev.filter(x => x !== v) : prev.length < 3 ? [...prev, v] : prev);
  };

  const finish = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id, color_type: color, body_type: body, style_preferences: vibes,
    }, { onConflict: "user_id" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Style profile saved");
    navigate({ to: "/wardrobe" });
  };

  const canNext = (step === 0 && color) || (step === 1 && body) || (step === 2 && vibes.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[428px] px-6 py-8">
        <div className="flex justify-center gap-2 mb-10">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-2 rounded-full transition-all ${i === step ? "w-8 bg-accent" : "w-2 bg-secondary"}`} />
          ))}
        </div>

        {step === 0 && (
          <>
            <h2 className="font-serif text-3xl mb-2">What's your color tone?</h2>
            <p className="text-muted-foreground mb-6">This shapes which colors will flatter you most.</p>
            <div className="space-y-3">
              {COLORS.map(c => (
                <button key={c.id} onClick={() => setColor(c.id)}
                  className={`w-full text-left card-soft p-5 flex items-center gap-4 transition ${color === c.id ? "ring-2 ring-accent" : ""}`}>
                  <div className="w-14 h-14 rounded-full shrink-0" style={{ background: c.grad }} />
                  <div>
                    <div className="font-medium text-lg">{c.label}</div>
                    <div className="text-sm text-muted-foreground">{c.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="font-serif text-3xl mb-2">Your body silhouette?</h2>
            <p className="text-muted-foreground mb-6">For balanced proportions.</p>
            <div className="grid grid-cols-2 gap-3">
              {BODIES.map(b => (
                <button key={b} onClick={() => setBody(b)}
                  className={`card-soft p-5 flex flex-col items-center gap-2 text-foreground transition ${body === b ? "ring-2 ring-accent" : ""}`}>
                  <Silhouette shape={b} />
                  <div className="text-sm font-medium">{b}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-serif text-3xl mb-2">Your style vibe?</h2>
            <p className="text-muted-foreground mb-6">Pick up to 3.</p>
            <div className="grid grid-cols-2 gap-3">
              {VIBES.map(v => (
                <button key={v} onClick={() => toggleVibe(v)}
                  className={`card-soft p-5 text-center transition ${vibes.includes(v) ? "ring-2 ring-accent bg-secondary" : ""}`}>
                  <div className="font-medium">{v}</div>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="mt-10 flex gap-3">
          {step > 0 && <button onClick={() => setStep(step - 1)} className="btn-outline flex-1">Back</button>}
          {step < 2 ? (
            <button disabled={!canNext} onClick={() => setStep(step + 1)} className="btn-primary flex-1">Continue</button>
          ) : (
            <button disabled={!canNext || busy} onClick={finish} className="btn-primary flex-1">{busy ? "…" : "Finish"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
