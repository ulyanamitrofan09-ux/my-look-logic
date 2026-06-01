import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AuthGate } from "@/components/AuthGate";

export const Route = createFileRoute("/wardrobe/add")({
  component: () => <AuthGate><AddItem /></AuthGate>,
});

const TYPES = ["Top", "Bottom", "Dress", "Jumpsuit", "Outerwear", "Shoes", "Bag", "Accessory"];
const SEASONS = ["Spring/Summer", "Fall/Winter", "Year-round"];
const FORMALITIES = ["Casual", "Smart Casual", "Business", "Formal"];

const SUBTYPE_HINT: Record<string, string> = {
  Top: "e.g. Linen Blazer", Bottom: "e.g. Wide-leg Trousers", Dress: "e.g. Slip Dress",
  Jumpsuit: "e.g. Linen Jumpsuit", Outerwear: "e.g. Trench Coat",
  Shoes: "e.g. Loafers", Bag: "e.g. Tote", Accessory: "e.g. Silk Scarf",
};

function AddItem() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [name, setName] = useState("");
  const [type, setType] = useState("Top");
  const [subtype, setSubtype] = useState("");
  const [color, setColor] = useState("#1C1C1C");
  const [season, setSeason] = useState<string[]>(["Year-round"]);
  const [formality, setFormality] = useState("Casual");
  const [busy, setBusy] = useState(false);

  const onFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) return toast.error("Max 10MB");
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return toast.error("JPG, PNG or WebP only");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const toggleSeason = (s: string) =>
    setSeason(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const save = async () => {
    if (!user || !file) return toast.error("Add a photo first");
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("wardrobe-items").upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("wardrobe-items").getPublicUrl(path);

      const { error } = await supabase.from("wardrobe_items").insert({
        user_id: user.id, photo_url: publicUrl, name: name || null,
        type, subtype: subtype || null, color_primary: color,
        season, formality,
      });
      if (error) throw error;
      toast.success("Added to wardrobe");
      navigate({ to: "/wardrobe" });
    } catch (e: any) {
      toast.error(e.message || "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[428px] px-5 py-6 pb-32">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/wardrobe" className="w-9 h-9 rounded-full bg-card flex items-center justify-center"><ArrowLeft size={18} /></Link>
          <h1 className="font-serif text-3xl">Add Item</h1>
        </div>

        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />

        <button onClick={() => fileRef.current?.click()}
          className="w-full aspect-square card-soft border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 overflow-hidden">
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-full object-contain bg-white" />
          ) : (
            <>
              <Camera size={36} className="text-muted-foreground" />
              <span className="text-muted-foreground">Tap to upload photo</span>
              <span className="text-xs text-muted-foreground">JPG · PNG · WebP · up to 10MB</span>
            </>
          )}
        </button>

        {preview && (
          <div className="mt-6 space-y-5">
            <div>
              <label className="text-sm font-medium block mb-2">Name</label>
              <input className="input-field" placeholder="e.g. White Linen Blazer" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Type</label>
              <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Subtype</label>
              <input className="input-field" placeholder={SUBTYPE_HINT[type]} value={subtype} onChange={(e) => setSubtype(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Primary Color</label>
              <div className="flex gap-3 items-center">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-12 rounded-full border-2 border-border cursor-pointer" />
                <input className="input-field flex-1" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Season</label>
              <div className="flex flex-wrap gap-2">
                {SEASONS.map(s => (
                  <button key={s} onClick={() => toggleSeason(s)} className={`chip ${season.includes(s) ? "chip-active" : ""}`}>{s}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Formality</label>
              <select className="input-field" value={formality} onChange={(e) => setFormality(e.target.value)}>
                {FORMALITIES.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>

            <p className="text-xs text-muted-foreground italic">AI will help auto-fill details — coming soon</p>

            <button disabled={busy} onClick={save} className="btn-primary w-full">
              {busy ? "Saving…" : "Save to Wardrobe"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
