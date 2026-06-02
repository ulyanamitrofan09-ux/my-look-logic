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
  { id: "Office Day", label: "Рабочий день", group: "Работа", Icon: Briefcase },
  { id: "Big Meeting", label: "Важная встреча", group: "Работа", Icon: BarChart3 },
  { id: "Job Interview", label: "Собеседование", group: "Работа", Icon: Star },
  { id: "First Date", label: "Первое свидание", group: "Социальное", Icon: Heart },
  { id: "Girls Night", label: "Девичник", group: "Социальное", Icon: Wine },
  { id: "Party", label: "Вечеринка", group: "Социальное", Icon: Music },
  { id: "Wedding Guest", label: "Свадьба (гость)", group: "Особое", Icon: Gem },
  { id: "Celebration", label: "Праздник", group: "Особое", Icon: Gift },
  { id: "Theater/Art", label: "Театр/искусство", group: "Особое", Icon: Drama },
  { id: "Casual Day", label: "Обычный день", group: "Каждый день", Icon: Sun },
  { id: "Travel", label: "Путешествие", group: "Каждый день", Icon: Plane },
  { id: "Weekend", label: "Выходные", group: "Каждый день", Icon: Coffee },
];

const WEATHERS = [
  { id: "Hot", label: "Жарко", emoji: "☀️" }, { id: "Warm", label: "Тепло", emoji: "🌤" },
  { id: "Cool", label: "Прохладно", emoji: "🍂" }, { id: "Cold", label: "Холодно", emoji: "❄️" },
];
const MOODS = [
  { id: "Confident", label: "Уверенно", emoji: "💪" }, { id: "Soft", label: "Мягко", emoji: "🌸" },
  { id: "Bold", label: "Смело", emoji: "⚡" }, { id: "Classic", label: "Классика", emoji: "👔" }, { id: "Playful", label: "Игриво", emoji: "🎨" },
];

function Outfits() {
  const navigate = useNavigate();
  const [occasion, setOccasion] = useState("");
  const [weather, setWeather] = useState("");
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);

  const grouped = ["Работа", "Социальное", "Особое", "Каждый день"].map(g => ({
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
        <h1 className="font-serif text-3xl">Какой повод?</h1>
      </div>

      <div className="px-5 space-y-5">
        {grouped.map(({ g, items }) => (
          <div key={g}>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{g}</div>
            <div className="grid grid-cols-2 gap-3">
              {items.map(({ id, label, Icon }) => (
                <button key={id} onClick={() => setOccasion(id)}
                  className={`card-soft p-4 flex items-center gap-3 transition ${occasion === id ? "ring-2 ring-accent" : ""}`}>
                  <Icon size={20} className="text-accent shrink-0" />
                  <span className="text-sm font-medium text-left">{label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {occasion && (
          <div>
            <h2 className="font-serif text-2xl mt-4 mb-3">Какая сегодня погода?</h2>
            <div className="grid grid-cols-4 gap-2">
              {WEATHERS.map(w => (
                <button key={w.id} onClick={() => setWeather(w.id)}
                  className={`card-soft p-3 flex flex-col items-center gap-1 transition ${weather === w.id ? "ring-2 ring-accent" : ""}`}>
                  <span className="text-2xl">{w.emoji}</span>
                  <span className="text-xs">{w.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {weather && (
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Настроение (необязательно)</div>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(m => (
                <button key={m.id} onClick={() => setMood(mood === m.id ? "" : m.id)}
                  className={`chip ${mood === m.id ? "chip-active" : ""}`}>
                  <span className="mr-1">{m.emoji}</span>{m.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 mt-8">
        <button disabled={!occasion || !weather || loading} onClick={generate} className="btn-dark w-full">
          {loading ? (
            <span className="flex items-center gap-2"><Sparkles size={16} className="animate-pulse" /> Flair подбирает образ…</span>
          ) : (
            <span className="flex items-center gap-2"><Sparkles size={16} /> Создать образ</span>
          )}
        </button>
        {loading && <p className="text-center text-sm text-muted-foreground mt-3">Анализируем ваш гардероб…</p>}
      </div>
    </AppShell>
  );
}
