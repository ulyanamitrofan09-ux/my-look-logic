import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Briefcase, BarChart3, Star, Heart, Wine, Music, Gem, Gift, Drama,
  Sun, Plane, Coffee, Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";

export const Route = createFileRoute("/outfits/")({
  component: () => <AuthGate><Outfits /></AuthGate>,
});

const OCCASIONS = [
  { id: "Office Day", group: "Work", Icon: Briefcase },
  { id: "Big Meeting", group: "Work", Icon: BarChart3 },
  { id: "Job Interview", group: "Work", Icon: Star },
  { id: "First Date", group: "Social", Icon: Heart },
  { id: "Girls Night", group: "Social", Icon: Wine },
  { id: "Party", group: "Social", Icon: Music },
  { id: "Wedding Guest", group: "Special", Icon: Gem },
  { id: "Celebration", group: "Special", Icon: Gift },
  { id: "Theater/Art", group: "Special", Icon: Drama },
  { id: "Casual Day", group: "Everyday", Icon: Sun },
  { id: "Travel", group: "Everyday", Icon: Plane },
  { id: "Weekend", group: "Everyday", Icon: Coffee },
];

const WEATHERS = [
  { id: "Hot", emoji: "☀️" }, { id: "Warm", emoji: "🌤" },
  { id: "Cool", emoji: "🍂" }, { id: "Cold", emoji: "❄️" },
];
const MOODS = [
  { id: "Confident", emoji: "💪" }, { id: "Soft", emoji: "🌸" },
  { id: "Bold", emoji: "⚡" }, { id: "Classic", emoji: "👔" }, { id: "Playful", emoji: "🎨" },
];

function Outfits() {
  const navigate = useNavigate();
  const [occasion, setOccasion] = useState("");
  const [weather, setWeather] = useState("");
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);

  const grouped = ["Work", "Social", "Special", "Everyday"].map(g => ({
    g, items: OCCASIONS.filter(o => o.group === g),
  }));

  const generate = () => {
    setLoading(true);
    setTimeout(() => navigate({
      to: "/outfits/results",
      search: { occasion, weather, mood } as any,
    }), 900);
  };

  return (
    <AppShell>
      <div className="px-5 pt-6 pb-3">
        <h1 className="font-serif text-3xl">What's the occasion?</h1>
      </div>

      <div className="px-5 space-y-5">
        {grouped.map(({ g, items }) => (
          <div key={g}>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{g}</div>
            <div className="grid grid-cols-2 gap-3">
              {items.map(({ id, Icon }) => (
                <button key={id} onClick={() => setOccasion(id)}
                  className={`card-soft p-4 flex items-center gap-3 transition ${occasion === id ? "ring-2 ring-accent" : ""}`}>
                  <Icon size={20} className="text-accent shrink-0" />
                  <span className="text-sm font-medium text-left">{id}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {occasion && (
          <div>
            <h2 className="font-serif text-2xl mt-4 mb-3">Today's weather?</h2>
            <div className="grid grid-cols-4 gap-2">
              {WEATHERS.map(w => (
                <button key={w.id} onClick={() => setWeather(w.id)}
                  className={`card-soft p-3 flex flex-col items-center gap-1 transition ${weather === w.id ? "ring-2 ring-accent" : ""}`}>
                  <span className="text-2xl">{w.emoji}</span>
                  <span className="text-xs">{w.id}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {weather && (
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Mood (optional)</div>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(m => (
                <button key={m.id} onClick={() => setMood(mood === m.id ? "" : m.id)}
                  className={`chip ${mood === m.id ? "chip-active" : ""}`}>
                  <span className="mr-1">{m.emoji}</span>{m.id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 mt-8">
        <button disabled={!occasion || !weather || loading} onClick={generate} className="btn-dark w-full">
          {loading ? (
            <span className="flex items-center gap-2"><Sparkles size={16} className="animate-pulse" /> Flair is styling you…</span>
          ) : (
            <span className="flex items-center gap-2"><Sparkles size={16} /> Generate My Outfit</span>
          )}
        </button>
        {loading && <p className="text-center text-sm text-muted-foreground mt-3">Analyzing your wardrobe…</p>}
      </div>
    </AppShell>
  );
}
