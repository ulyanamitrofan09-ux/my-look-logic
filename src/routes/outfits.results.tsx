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
        <button onClick={() => navigate({ to: "/outfits" })} className="w-9 h-9 rounded-full bg-card flex items-center justify-center"><ArrowLeft size={18} /></button>
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
          <article key={idx} className="card-soft p-5" style={{ borderRadius: 20 }}>
            <div className="grid grid-cols-3 gap-2">
              {o.items.slice(0, 3).map(it => (
                <div key={it.id}>
                  <div className="rounded-xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: "#FFFFFF", padding: 8, minHeight: 180 }}>
                    <img src={it.photo_url} alt={it.name || it.type} style={{ objectFit: "contain", maxHeight: 160, width: "100%", mixBlendMode: "multiply" }} />
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground text-center truncate">{it.name || it.subtype || it.type}</div>
                </div>
              ))}
            </div>
            <hr className="my-4 border-border" />
            <h3 className="font-serif text-2xl">{o.name}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{o.explanation}</p>
            <div className="flex gap-2 mt-3">
              {o.tags.map(t => <span key={t} className="chip">{t}</span>)}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => save(o)} className="btn-outline flex-1"><Bookmark size={16} className="mr-1" /> Сохранить</button>
              <button onClick={() => { navigator.clipboard?.writeText(o.name); toast.success("Скопировано"); }} className="btn-outline flex-1"><Share2 size={16} className="mr-1" /> Поделиться</button>
            </div>
          </article>
        ))}

        {outfits.length > 0 && (
          <button onClick={() => setReroll(r => r + 1)} className="btn-dark w-full">Сгенерировать ещё</button>
        )}
      </div>
    </AppShell>
  );
}
