import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";

export const Route = createFileRoute("/wardrobe/")({
  component: () => <AuthGate><WardrobePage /></AuthGate>,
});

const FILTERS = ["All", "Tops", "Bottoms", "Dresses", "Shoes", "Bags", "Accessories"] as const;

const TYPE_MAP: Record<string, string[]> = {
  Tops: ["Top"], Bottoms: ["Bottom"], Dresses: ["Dress", "Jumpsuit"],
  Shoes: ["Shoes"], Bags: ["Bag"], Accessories: ["Accessory", "Outerwear"],
};

function WardrobePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [outfitCount, setOutfitCount] = useState(0);
  const [filter, setFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: wi }, { count }] = await Promise.all([
        supabase.from("wardrobe_items").select("*").order("created_at", { ascending: false }),
        supabase.from("outfit_saves").select("*", { count: "exact", head: true }),
      ]);
      setItems(wi || []);
      setOutfitCount(count || 0);
      setLoading(false);
    })();
  }, [user]);

  const filtered = filter === "All" ? items : items.filter(i => TYPE_MAP[filter]?.includes(i.type));
  const firstLetter = (user?.user_metadata?.name || user?.email || "?")[0].toUpperCase();

  return (
    <AppShell>
      <header className="px-5 pt-6 pb-3 flex items-center justify-between">
        <span className="font-serif text-2xl">Flair</span>
        <Link to="/profile" className="w-10 h-10 rounded-full bg-dark text-dark-foreground flex items-center justify-center font-medium">
          {firstLetter}
        </Link>
      </header>

      <div className="px-5 text-sm text-muted-foreground">
        {items.length} item{items.length === 1 ? "" : "s"} · {outfitCount} outfit{outfitCount === 1 ? "" : "s"} saved
      </div>

      <div className="mt-4 px-5 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 pb-2">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`chip ${filter === f ? "chip-active" : ""}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4">
        {loading ? (
          <div className="text-muted-foreground text-sm text-center py-20">Loading wardrobe…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-secondary flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 4a2 2 0 100 4 2 2 0 000-4zM12 8v2m-8 6l8-6 8 6M4 16l8 4 8-4" />
              </svg>
            </div>
            <h3 className="font-serif text-2xl mb-1">Your wardrobe is empty</h3>
            <p className="text-muted-foreground mb-6">Add your first piece to get started</p>
            <Link to="/wardrobe/add" className="btn-primary">Add first item</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(it => (
              <div key={it.id} className="card-soft overflow-hidden">
                <div className="aspect-square bg-white flex items-center justify-center p-2">
                  <img src={it.photo_url} alt={it.name || it.type} className="w-full h-full object-contain" />
                </div>
                <div className="px-3 py-2 text-[13px] text-muted-foreground">{it.name || it.subtype || it.type}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <Link to="/wardrobe/add"
          className="fixed bottom-24 right-[max(1.25rem,calc(50%-214px+1.25rem))] z-30 bg-dark text-dark-foreground rounded-full shadow-lg flex items-center gap-2 px-5 py-3.5">
          <Plus size={18} /> <span className="text-sm font-medium">Add Item</span>
        </Link>
      )}
    </AppShell>
  );
}
