import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";

export const Route = createFileRoute("/lookbook")({
  component: () => <AuthGate><Lookbook /></AuthGate>,
});

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

function Lookbook() {
  const { user } = useAuth();
  const [outfits, setOutfits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: saves } = await supabase.from("outfit_saves").select("outfit_id, saved_at").order("saved_at", { ascending: false });
      if (!saves?.length) { setOutfits([]); setLoading(false); return; }
      const { data: outs } = await supabase.from("outfits").select("*").in("id", saves.map(s => s.outfit_id));
      const ids = Array.from(new Set((outs || []).flatMap(o => o.items || [])));
      const { data: items } = ids.length
        ? await supabase.from("wardrobe_items").select("id,photo_url,name,type").in("id", ids)
        : { data: [] as any[] };
      const map = new Map((items || []).map((i: any) => [i.id, i]));
      setOutfits((outs || []).map(o => ({ ...o, itemDetails: (o.items || []).map((id: string) => map.get(id)).filter(Boolean) })));
      setLoading(false);
    })();
  }, [user]);

  return (
    <AppShell>
      <div className="px-5 pt-6 pb-2">
        <h1 className="font-serif text-3xl">Лукбук</h1>
        <p className="text-sm text-muted-foreground mt-1">{outfits.length} {plural(outfits.length, "сохранённый образ", "сохранённых образа", "сохранённых образов")}</p>
      </div>
      <div className="px-5 mt-4">
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Загрузка…</div>
        ) : outfits.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="font-serif text-2xl mb-1">Пока нет образов</h3>
            <p className="text-muted-foreground">Сохраните первый образ, чтобы начать Лукбук</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {outfits.map(o => (
              <div key={o.id} className="card-soft p-3">
                <div className="grid grid-cols-3 gap-1">
                  {o.itemDetails.slice(0, 3).map((it: any) => (
                    <div key={it.id} className="rounded-md overflow-hidden flex items-center justify-center" style={{ backgroundColor: "#FFFFFF", padding: 8, minHeight: 180 }}>
                      <img src={it.photo_url} alt="" style={{ objectFit: "contain", maxHeight: 160, width: "100%", mixBlendMode: "multiply" }} />
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="text-xs text-accent">{o.occasion}</div>
                  <div className="text-sm font-medium truncate">{o.name}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ru-RU")}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
