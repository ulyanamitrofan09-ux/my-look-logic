import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/wardrobe/")({
  component: () => <AuthGate><WardrobePage /></AuthGate>,
});

const FILTERS = ["All", "Tops", "Bottoms", "Dresses", "Shoes", "Bags", "Accessories"] as const;

const TYPE_MAP: Record<string, string[]> = {
  Tops: ["Top"], Bottoms: ["Bottom"], Dresses: ["Dress", "Jumpsuit"],
  Shoes: ["Shoes"], Bags: ["Bag"], Accessories: ["Accessory", "Outerwear"],
};

const DELETE_COLOR = "#E53E3E";

function WardrobePage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [outfitCount, setOutfitCount] = useState(0);
  const [filter, setFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [quickMenu, setQuickMenu] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const loadItems = async () => {
    const [{ data: wi }, { count }] = await Promise.all([
      supabase.from("wardrobe_items").select("*").order("created_at", { ascending: false }),
      supabase.from("outfit_saves").select("*", { count: "exact", head: true }),
    ]);
    setItems(wi || []);
    setOutfitCount(count || 0);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    loadItems();
  }, [user]);

  const filtered = filter === "All" ? items : items.filter(i => TYPE_MAP[filter]?.includes(i.type));
  const firstLetter = (user?.user_metadata?.name || user?.email || "?")[0].toUpperCase();

  const handleDelete = async (item: any) => {
    if (!item) return;
    setDeleting(true);
    try {
      // Try to remove storage file (extract path after bucket name)
      if (item.photo_url) {
        const marker = "/wardrobe-items/";
        const idx = item.photo_url.indexOf(marker);
        if (idx !== -1) {
          const path = item.photo_url.substring(idx + marker.length).split("?")[0];
          await supabase.storage.from("wardrobe-items").remove([path]);
        }
      }
      const { error } = await supabase.from("wardrobe_items").delete().eq("id", item.id);
      if (error) throw error;
      toast.success("Вещь удалена");
      setItems(prev => prev.filter(i => i.id !== item.id));
      setConfirmOpen(false);
      setSelected(null);
      setQuickMenu(null);
    } catch (e: any) {
      toast.error(e.message || "Не удалось удалить");
    } finally {
      setDeleting(false);
    }
  };

  const startPress = (id: string) => {
    longPressed.current = false;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      setQuickMenu(id);
    }, 500);
  };
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

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
              <div
                key={it.id}
                className="card-soft overflow-hidden relative cursor-pointer select-none"
                onClick={() => { if (!longPressed.current) setSelected(it); }}
                onContextMenu={(e) => { e.preventDefault(); setQuickMenu(it.id); }}
                onTouchStart={() => startPress(it.id)}
                onTouchEnd={cancelPress}
                onTouchMove={cancelPress}
                onTouchCancel={cancelPress}
              >
                <div className="flex items-center justify-center" style={{ backgroundColor: "#FFFFFF", padding: 8, minHeight: 180 }}>
                  <img src={it.photo_url} alt={it.name || it.type} style={{ objectFit: "contain", maxHeight: 160, width: "100%", mixBlendMode: "multiply" }} />
                </div>
                <div className="px-3 py-2 text-[13px] text-muted-foreground">{it.name || it.subtype || it.type}</div>

                {quickMenu === it.id && (
                  <div
                    className="absolute inset-0 bg-black/40 flex items-center justify-center z-10"
                    onClick={(e) => { e.stopPropagation(); setQuickMenu(null); }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelected(it); setConfirmOpen(true); setQuickMenu(null); }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full text-white font-medium shadow-lg"
                      style={{ backgroundColor: DELETE_COLOR }}
                    >
                      <Trash2 size={16} /> Удалить
                    </button>
                  </div>
                )}
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

      {/* Item detail modal */}
      <Dialog open={!!selected && !confirmOpen} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-sm p-0 overflow-hidden gap-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="font-serif text-xl">
              {selected?.name || selected?.subtype || selected?.type || "Вещь"}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <>
              <div className="flex items-center justify-center" style={{ backgroundColor: "#FFFFFF", padding: 16, minHeight: 280 }}>
                <img
                  src={selected.photo_url}
                  alt={selected.name || selected.type}
                  style={{ objectFit: "contain", maxHeight: 320, width: "100%", mixBlendMode: "multiply" }}
                />
              </div>
              <div className="px-4 py-3 flex flex-wrap gap-1.5">
                {[selected.type, selected.subtype, selected.color_primary, selected.pattern, selected.formality, selected.style_vibe]
                  .filter(Boolean)
                  .map((t: string, i: number) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">{t}</span>
                  ))}
              </div>
              <div className="p-4 pt-2">
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-white font-medium"
                  style={{ backgroundColor: DELETE_COLOR }}
                >
                  <Trash2 size={18} /> Удалить вещь
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить вещь из гардероба?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => { e.preventDefault(); handleDelete(selected); }}
              style={{ backgroundColor: DELETE_COLOR, color: "white" }}
            >
              {deleting ? "Удаление…" : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
