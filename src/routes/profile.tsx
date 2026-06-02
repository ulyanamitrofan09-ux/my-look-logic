import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";

export const Route = createFileRoute("/profile")({
  component: () => <AuthGate><Profile /></AuthGate>,
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Link to="/onboarding" className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </Link>
  );
}

function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ items: 0, outfits: 0, saved: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { count: ic }, { count: oc }, { count: sc }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("wardrobe_items").select("*", { count: "exact", head: true }),
        supabase.from("outfits").select("*", { count: "exact", head: true }),
        supabase.from("outfit_saves").select("*", { count: "exact", head: true }),
      ]);
      setProfile(p);
      setStats({ items: ic || 0, outfits: oc || 0, saved: sc || 0 });
    })();
  }, [user]);

  const name = profile?.name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Вы";
  const initial = name[0]?.toUpperCase() || "?";
  const itemsLeft = Math.max(0, 20 - stats.items);

  return (
    <AppShell>
      <div className="px-5 pt-8 pb-4 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-dark text-dark-foreground flex items-center justify-center text-2xl font-medium">{initial}</div>
        <div className="mt-3 font-medium text-lg">{name}</div>
        <div className="text-muted-foreground text-sm">{user?.email}</div>
      </div>

      <div className="px-5 mt-2 space-y-5">
        <section className="card-soft p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Мой стиль</div>
          <Row label="Цветотип" value={profile?.color_type || ""} />
          <Row label="Силуэт" value={profile?.body_type || ""} />
          <Row label="Стиль" value={(profile?.style_preferences || []).join(", ")} />
        </section>

        <section className="card-soft p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Статистика гардероба</div>
          <div className="grid grid-cols-3 text-center">
            <div><div className="font-serif text-2xl">{stats.items}</div><div className="text-xs text-muted-foreground">Вещей</div></div>
            <div><div className="font-serif text-2xl">{stats.outfits}</div><div className="text-xs text-muted-foreground">Создано</div></div>
            <div><div className="font-serif text-2xl">{stats.saved}</div><div className="text-xs text-muted-foreground">Сохранено</div></div>
          </div>
        </section>

        <section className="card-soft p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Аккаунт</div>
          <button className="w-full text-left py-2 text-sm border-b border-border" onClick={() => toast.info("Скоро")}>Изменить email</button>
          <button className="w-full text-left py-2 text-sm border-b border-border" onClick={() => toast.info("Скоро")}>Сменить пароль</button>
          <button onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="w-full text-left py-2 text-sm text-destructive">Выйти</button>
        </section>

        <section className="rounded-2xl p-5 bg-dark text-dark-foreground">
          <div className="font-serif text-2xl mb-1">Безлимит образов</div>
          <div className="text-sm opacity-80 mb-4">Осталось {itemsLeft} вещей на бесплатном тарифе · {stats.items}/20 использовано</div>
          <button className="btn-primary w-full" onClick={() => toast.info("Premium скоро")}>Перейти на Premium</button>
        </section>
      </div>
    </AppShell>
  );
}
