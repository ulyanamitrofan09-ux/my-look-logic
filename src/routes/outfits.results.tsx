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

const FALLBACK_PALETTES = [
  ["#F5EDE3", "#E8D5C0", "#D4B896", "#B89B7A", "#8B6F52"],
  ["#EAF0E8", "#D0DEC9", "#B5CCAB", "#8CAF82", "#5C7A52"],
  ["#E3EBF5", "#C4D5EA", "#9FBBD8", "#6B96C4", "#3D6A9B"],
  ["#F5E3EC", "#EAC4D8", "#D89BB8", "#C2728F", "#9B4A68"],
  ["#F5F0E3", "#EAE0C4", "#D8CE9B", "#C4B86B", "#9B8F3D"],
];

async function extractColors(url: string): Promise<string[]> {
  try {
    // Fetch via blob to avoid CORS canvas taint issues
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        try {
          const size = 80;
          const canvas = document.createElement("canvas");
          canvas.width = size; canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) { resolve([]); return; }
          ctx.drawImage(img, 0, 0, size, size);
          const { data } = ctx.getImageData(0, 0, size, size);
          const map = new Map<string, { r: number; g: number; b: number; n: number }>();
          for (let i = 0; i < data.length; i += 4) {
            const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
            if (a < 80) continue;
            if (r + g + b > 758 || r + g + b < 30) continue;
            const key = `${Math.round(r / 25) * 25},${Math.round(g / 25) * 25},${Math.round(b / 25) * 25}`;
            const e = map.get(key);
            if (e) { e.r += r; e.g += g; e.b += b; e.n++; }
            else map.set(key, { r, g, b, n: 1 });
          }
          const top = [...map.values()].sort((a, b) => b.n - a.n).slice(0, 5);
          resolve(top.map(c => `rgb(${Math.round(c.r / c.n)},${Math.round(c.g / c.n)},${Math.round(c.b / c.n)})`));
        } catch { URL.revokeObjectURL(objectUrl); resolve([]); }
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve([]); };
      img.src = objectUrl;
    });
  } catch { return []; }
}

async function buildPalette(items: Item[], fallbackIdx: number): Promise<string[]> {
  const colors: string[] = [];
  for (const item of items.slice(0, 3)) {
    const c = await extractColors(item.photo_url);
    for (const color of c) {
      if (!colors.includes(color)) colors.push(color);
      if (colors.length >= 5) break;
    }
    if (colors.length >= 5) break;
  }
  return colors.length >= 3 ? colors.slice(0, 5) : FALLBACK_PALETTES[fallbackIdx % FALLBACK_PALETTES.length];
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
  const take = (pool: Item[]) => { const f = pool.find(i => !usedItems.has(i.id)); if (f) usedItems.add(f.id); return f; };
  const tryBuild = (): Item[] => {
    const set: Item[] = [];
    if (tops.length && bottoms.length) { const t = take(tops); if (t) set.push(t); const b = take(bottoms); if (b) set.push(b); }
    else if (dresses.length) { const d = take(dresses); if (d) set.push(d); }
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
    explanation: `Этот образ подходит для «${occasion.toLowerCase()}», потому что вещи объединены тональной гармонией — примерно 60% нейтральных оттенков, 30% средних и 10% акцентных, — а пропорции остаются сбалансированными.`,
    tags: TAGS[i % TAGS.length],
    items: set,
  }));
}

const TOP_TYPES = ["Top", "Outerwear", "Dress", "Jumpsuit"];
const BOTTOM_TYPES = ["Bottom"];

// Returns absolute positioning style for each item based on its clothing type
// Reference layout: top garment left-center (front), bottom garment right (back), accent bottom-center
function getItemStyle(item: Item, allItems: Item[]): React.CSSProperties {
  const hasTop = allItems.some(i => TOP_TYPES.includes(i.type));

  if (TOP_TYPES.includes(item.type)) {
    return { position: "absolute", top: "2%", left: "2%", width: "68%", zIndex: 3 };
  }
  if (BOTTOM_TYPES.includes(item.type)) {
    return { position: "absolute", top: hasTop ? "20%" : "2%", right: "0%", width: "68%", zIndex: hasTop ? 2 : 3 };
  }
  return { position: "absolute", bottom: "2%", left: "6%", width: "54%", zIndex: 4 };
}

function OutfitCard({ outfit, index, onSave }: { outfit: Outfit; index: number; onSave: () => void }) {
  const [palette, setPalette] = useState<string[]>(FALLBACK_PALETTES[index % FALLBACK_PALETTES.length]);
  const [saved, setSaved] = useState(false);
  const num = String(index + 1).padStart(2, "0");

  useEffect(() => {
    buildPalette(outfit.items, index).then(setPalette);
  }, [outfit.items, index]);

  return (
    <article style={{ borderRadius: 20, overflow: "hidden", background: "#F7F3EE", boxShadow: "0 4px 24px rgba(0,0,0,0.09)" }}>
      <div style={{ display: "flex", height: 420 }}>

        {/* Left panel: number + name + palette swatches */}
        <div style={{
          width: 115, flexShrink: 0,
          padding: "20px 10px 20px 18px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 11, color: "#8C7B70", letterSpacing: "0.12em" }}>{num}</div>
            <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 15, fontWeight: 600, lineHeight: 1.25, color: "#1C1C1C", marginTop: 4 }}>{outfit.name}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {palette.map((color, i) => (
              <div key={i} style={{ height: 33, borderRadius: 9, background: color, border: "1px solid rgba(0,0,0,0.08)" }} />
            ))}
          </div>
        </div>

        {/* Right panel: fashion flat lay collage */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {outfit.items.map((item) => (
            <div key={item.id} style={getItemStyle(item, outfit.items)}>
              <img
                src={item.photo_url}
                alt={item.name || item.type}
                style={{ width: "100%", objectFit: "contain", display: "block" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: explanation + tags + actions */}
      <div style={{ padding: "14px 18px 18px", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
        <p style={{ fontSize: 13, color: "#8C7B70", lineHeight: 1.65, margin: 0 }}>{outfit.explanation}</p>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {outfit.tags.map(t => (
            <span key={t} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 999, background: "rgba(0,0,0,0.06)", color: "#5C4A40" }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={() => { setSaved(true); onSave(); }} className="btn-outline" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Bookmark size={15} fill={saved ? "currentColor" : "none"} /> {saved ? "Сохранено" : "Сохранить"}
          </button>
          <button onClick={() => { navigator.clipboard?.writeText(outfit.name); toast.success("Скопировано"); }} className="btn-outline" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
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

      <div className="px-5 mt-4 space-y-5 pb-6">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Подбираем образы…</div>
        ) : outfits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Сначала добавьте минимум 2 вещи в гардероб.</p>
            <Link to="/wardrobe/add" className="btn-primary">Добавить вещи</Link>
          </div>
        ) : outfits.map((o, idx) => (
          <OutfitCard key={idx} outfit={o} index={idx} onSave={() => save(o)} />
        ))}
        {outfits.length > 0 && (
          <button onClick={() => setReroll(r => r + 1)} className="btn-dark w-full">Сгенерировать ещё</button>
        )}
      </div>
    </AppShell>
  );
}
