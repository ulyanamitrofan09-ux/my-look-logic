import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";

export const Route = createFileRoute("/outfits/results")({
  validateSearch: (s: Record<string, unknown>) => ({
    occasion: (s.occasion as string) || "",
    weather: (s.weather as string) || "",
    mood: (s.mood as string) || "",
  }),
  component: () => <AuthGate><Results /></AuthGate>,
});

type Item = { id: string; name: string | null; type: string; subtype: string | null; photo_url: string };
type Outfit = { name: string; explanation: string; tags: string[]; items: Item[] };

const NAMES = ["Уверенная классика", "Тихая сила", "Мягкие акценты", "Лёгкая элегантность", "Современный шик", "Непринуждённый образ"];
const TAGS = [["Утончённый", "По фигуре"], ["Мягкий", "Продуманный"], ["Смелый", "Современный"], ["Лёгкий", "Изысканный"]];

const PALETTES = [
  ["#F5EDE3", "#E8D5C0", "#D4B896", "#B89B7A", "#8B6F52"],
  ["#EAF0E8", "#D0DEC9", "#B5CCAB", "#8CAF82", "#5C7A52"],
  ["#E3EBF5", "#C4D5EA", "#9FBBD8", "#6B96C4", "#3D6A9B"],
  ["#F5E3EC", "#EAC4D8", "#D89BB8", "#C2728F", "#9B4A68"],
  ["#F5F0E3", "#EAE0C4", "#D8CE9B", "#C4B86B", "#9B8F3D"],
  ["#EDE3F5", "#D8C4EA", "#C29BD8", "#A86BC2", "#7A3D9B"],
];

function makePalette(idx: number, items: Item[]): string[] {
  return PALETTES[idx % PALETTES.length];
}

function makeOutfits(items: Item[], occasion: string): Outfit[] {
  const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
  const tops = shuffle(items.filter(i => i.type === "Top"));
  const bottoms = shuffle(items.filter(i => i.type === "Bottom"));
  const dresses = shuffle(items.filter(i => i.type === "Dress" || i.type === "Jumpsuit"));
  const shoes = shuffle(items.filter(i => i.type === "Shoes"));
  const accents = shuffle(items.filter(i => ["Bag", "Accessory", "Outerwear"].includes(i.type)));

  const target = items.length < 6 ? 2 : 3;
  const combos: Item[][] = [];
  const usedKeys = new Set<string>();
  const usedItems = new Set<string>();

  const take = (pool: Item[]): Item | undefined => {
    const fresh = pool.find(i => !usedItems.has(i.id));
    if (fresh) { usedItems.add(fresh.id); return fresh; }
    return undefined;
  };

  const tryBuild = (): Item[] => {
    const set: Item[] = [];
    if (tops.length && bottoms.length) {
      const t = take(tops); if (t) set.push(t);
      const b = take(bottoms); if (b) set.push(b);
    } else if (dresses.length) {
      const d = take(dresses); if (d) set.push(d);
    }
    const sh = take(shoes); if (sh) set.push(sh);
    if (set.length < 3) { const a = take(accents); if (a) set.push(a); }
    return set;
  };

  for (let i = 0; i < target; i++) {
    const set = tryBuild();
    const uniq = Array.from(new Map(set.map(it => [it.id, it])).values());
    if (uniq.length < 2) break;
    const key = uniq.map(it => it.id).sort().join("|");
    if (usedKeys.has(key)) break;
    usedKeys.add(key);
    combos.push(uniq.slice(0, 3));
  }

  return combos.map((set, i) => ({
    name: NAMES[i % NAMES.length],
    explanation: `Этот образ подходит для «${occasion.toLowerCase()}», потому что вещи объединены тональной гармонией — примерно 60% нейтральных оттенков, 30% средних и 10% акцентных, — а пропорции остаются сбалансированными. Уровень формальности попадает точно в нужный регистр, без лишних усилий.`,
    tags: TAGS[i % TAGS.length],
    items: set,
  }));
}

const FLAT_LAY_POSITIONS = [
  { top: "2%",  right: "2%",  width: "58%", rotate: "-5deg", zIndex: 3 },
  { top: "28%", left:  "2%",  width: "54%", rotate: "4deg",  zIndex: 2 },
  { top: "56%", right: "4%",  width: "50%", rotate: "-3deg", zIndex: 1 },
];

const FLAT_LAY_POSITIONS_2 = [
  { top: "10%", right: "2%",  width: "60%", rotate: "-5deg", zIndex: 2 },
  { top: "42%", left: "2%",   width: "56%", rotate: "4deg",  zIndex: 1 },
];

function FlatLayCard({ outfit, index, onSave }: { outfit: Outfit; index: number; onSave: () => void }) {
  const palette = makePalette(index, outfit.items);
  const positions = outfit.items.length >= 3 ? FLAT_LAY_POSITIONS : FLAT_LAY_POSITIONS_2;
  const num = String(index + 1).padStart(2, "0");

  return (
    <article style={{
      borderRadius: 20,
      overflow: "hidden",
      background: "#F7F3EE",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    }}>
      {/* Top row: flat lay collage */}
      <div style={{ display: "flex", minHeight: 280 }}>
        {/* Left panel: number + name + palette */}
        <div style={{
          width: "38%",
          padding: "20px 14px 20px 18px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontFamily: "Cormorant Garamond, Playfair Display, serif",
              fontSize: 13,
              letterSpacing: "0.08em",
              color: "#8C7B70",
              marginBottom: 2,
            }}>{num}</div>
            <div style={{
              fontFamily: "Cormorant Garamond, Playfair Display, serif",
              fontSize: 15,
              fontWeight: 600,
              color: "#1C1C1C",
              lineHeight: 1.25,
              marginBottom: 16,
            }}>{outfit.name}</div>
          </div>
          {/* Color swatches */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {palette.map((color, i) => (
              <div key={i} style={{
                height: 32,
                borderRadius: 10,
                background: color,
                border: "1px solid rgba(0,0,0,0.06)",
              }} />
            ))}
          </div>
        </div>

        {/* Right panel: flat lay collage */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {outfit.items.slice(0, positions.length).map((item, i) => (
            <div key={item.id} style={{
              position: "absolute",
              ...positions[i],
              transform: `rotate(${positions[i].rotate})`,
              zIndex: positions[i].zIndex,
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.12))",
            }}>
              <img
                src={item.photo_url}
                alt={item.name || item.type}
                style={{
                  width: "100%",
                  objectFit: "contain",
                  mixBlendMode: "multiply",
                  display: "block",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: explanation + tags + actions */}
      <div style={{ padding: "16px 18px 18px", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
        <p style={{ fontSize: 13, color: "#8C7B70", lineHeight: 1.6, margin: 0 }}>{outfit.explanation}</p>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {outfit.tags.map(t => (
            <span key={t} style={{
              fontSize: 11,
              padding: "4px 12px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.06)",
              color: "#5C4A40",
              letterSpacing: "0.04em",
            }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={onSave} className="btn-outline" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Bookmark size={15} /> Сохранить
          </button>
          <button
            onClick={() => { navigator.clipboard?.writeText(outfit.name); toast.success("Скопировано"); }}
            className="btn-outline"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <Share2 size={15} /> Поделиться
          </button>
        </div>
      </div>
    </article>
  );
}

function Results() {
  const { occasion, weather, mood } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [reroll, setReroll] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("wardrobe_items").select("id,name,type,subtype,photo_url");
      setOutfits(makeOutfits((data as Item[]) || [], occasion));
      setLoading(false);
    })();
  }, [user, occasion, reroll]);

  const save = async (o: Outfit) => {
    if (!user) return;
    const { data: created, error } = await supabase.from("outfits").insert({
      user_id: user.id, name: o.name, occasion, weather, mood: mood || null,
      items: o.items.map(i => i.id), explanation: o.explanation, tags: o.tags,
    }).select("id").single();
    if (error || !created) return toast.error("Не удалось сохранить");
    await supabase.from("outfit_saves").insert({ user_id: user.id, outfit_id: created.id });
    toast.success("Сохранено в Лукбук");
  };

  return (
    <AppShell>
      <div className="px-5 pt-6 pb-3 flex items-center gap-3">
        <button onClick={() => navigate({ to: "/outfits" })} className="w-9 h-9 rounded-full bg-card flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-serif text-3xl">Ваши образы</h1>
          <div className="text-sm text-accent">{occasion} · {weather}{mood && ` · ${mood}`}</div>
        </div>
      </div>

      <div className="px-5 mt-4 space-y-5">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Подбираем образы…</div>
        ) : outfits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Сначала добавьте минимум 2 вещи в гардероб.</p>
            <Link to="/wardrobe/add" className="btn-primary">Добавить вещи</Link>
          </div>
        ) : outfits.map((o, idx) => (
          <FlatLayCard key={idx} outfit={o} index={idx} onSave={() => save(o)} />
        ))}

        {outfits.length > 0 && (
          <button onClick={() => setReroll(r => r + 1)} className="btn-dark w-full">
            Сгенерировать ещё
          </button>
        )}
      </div>
    </AppShell>
  );
}
