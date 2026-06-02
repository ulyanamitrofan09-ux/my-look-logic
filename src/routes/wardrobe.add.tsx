import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AuthGate } from "@/components/AuthGate";
import { removeBackground } from "@/lib/removebg.functions";

export const Route = createFileRoute("/wardrobe/add")({
  component: () => <AuthGate><AddItem /></AuthGate>,
});

const TYPES = [
  { id: "Top", label: "Верх" },
  { id: "Bottom", label: "Низ" },
  { id: "Dress", label: "Платье" },
  { id: "Jumpsuit", label: "Комбинезон" },
  { id: "Outerwear", label: "Верхняя одежда" },
  { id: "Shoes", label: "Обувь" },
  { id: "Bag", label: "Сумка" },
  { id: "Accessory", label: "Аксессуар" },
];
const SEASONS = [
  { id: "Spring/Summer", label: "Весна/Лето" },
  { id: "Fall/Winter", label: "Осень/Зима" },
  { id: "Year-round", label: "Круглый год" },
];
const FORMALITIES = [
  { id: "Casual", label: "Кэжуал" },
  { id: "Smart Casual", label: "Смарт-кэжуал" },
  { id: "Business", label: "Деловой" },
  { id: "Formal", label: "Торжественный" },
];

const SUBTYPE_HINT: Record<string, string> = {
  Top: "напр. Льняной блейзер", Bottom: "напр. Широкие брюки", Dress: "напр. Платье-комбинация",
  Jumpsuit: "напр. Льняной комбинезон", Outerwear: "напр. Тренч",
  Shoes: "напр. Лоферы", Bag: "напр. Тоут", Accessory: "напр. Шёлковый платок",
};

function AddItem() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const removeBg = useServerFn(removeBackground);
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
  const [busyLabel, setBusyLabel] = useState("Сохранение…");

  const onFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) return toast.error("Максимум 10 МБ");
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return toast.error("Только JPG, PNG или WebP");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const toggleSeason = (s: string) =>
    setSeason(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const save = async () => {
    if (!user || !file) return toast.error("Сначала добавьте фото");
    setBusy(true);
    try {
      setBusyLabel("Удаляем фон...");
      let uploadBlob: Blob = file;
      let ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      try {
        const formData = new FormData();
        formData.append("image_file", file);
        formData.append("size", "auto");
        const response = await fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: { "X-Api-Key": "PDxZCD3kKniPqeCs5SULBrbX" },
          body: formData,
        });
        if (!response.ok) throw new Error(`remove.bg ${response.status}`);
        uploadBlob = await response.blob();
        ext = "png";
      } catch (e) {
        console.warn("remove.bg failed, using original", e);
      }

      setBusyLabel("Сохранение…");
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("wardrobe-items")
        .upload(path, uploadBlob, { contentType: ext === "png" ? "image/png" : file.type });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("wardrobe-items").getPublicUrl(path);

      const { error } = await supabase.from("wardrobe_items").insert({
        user_id: user.id, photo_url: publicUrl, name: name || null,
        type, subtype: subtype || null, color_primary: color,
        season, formality,
      });
      if (error) throw error;
      toast.success("Добавлено в гардероб");
      navigate({ to: "/wardrobe" });
    } catch (e: any) {
      toast.error(e.message || "Не удалось сохранить");
    } finally {
      setBusy(false);
      setBusyLabel("Сохранение…");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[428px] px-5 py-6 pb-32">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/wardrobe" className="w-9 h-9 rounded-full bg-card flex items-center justify-center"><ArrowLeft size={18} /></Link>
          <h1 className="font-serif text-3xl">Добавить вещь</h1>
        </div>

        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />

        <button onClick={() => fileRef.current?.click()}
          className="w-full aspect-square card-soft border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 overflow-hidden">
          {preview ? (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#FFFFFF", padding: 8, minHeight: 180 }}>
              <img src={preview} alt="preview" style={{ objectFit: "contain", maxHeight: 160, width: "100%" }} />
            </div>
          ) : (
            <>
              <Camera size={36} className="text-muted-foreground" />
              <span className="text-muted-foreground">Нажмите, чтобы загрузить фото</span>
              <span className="text-xs text-muted-foreground">JPG · PNG · WebP · до 10 МБ</span>
            </>
          )}
        </button>

        {preview && (
          <div className="mt-6 space-y-5">
            <div>
              <label className="text-sm font-medium block mb-2">Название</label>
              <input className="input-field" placeholder="напр. Белый льняной блейзер" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Тип</label>
              <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Подтип</label>
              <input className="input-field" placeholder={SUBTYPE_HINT[type]} value={subtype} onChange={(e) => setSubtype(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Основной цвет</label>
              <div className="flex gap-3 items-center">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-12 rounded-full border-2 border-border cursor-pointer" />
                <input className="input-field flex-1" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Сезон</label>
              <div className="flex flex-wrap gap-2">
                {SEASONS.map(s => (
                  <button key={s.id} onClick={() => toggleSeason(s.id)} className={`chip ${season.includes(s.id) ? "chip-active" : ""}`}>{s.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Формальность</label>
              <select className="input-field" value={formality} onChange={(e) => setFormality(e.target.value)}>
                {FORMALITIES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </div>

            <p className="text-xs text-muted-foreground italic">ИИ скоро будет помогать с авто-заполнением</p>

            <button disabled={busy} onClick={save} className="btn-primary w-full">
              {busy ? busyLabel : "Сохранить в гардероб"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
