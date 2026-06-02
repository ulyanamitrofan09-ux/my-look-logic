import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Upload, Calendar, Sparkles, Check } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flair — ваш ИИ-стилист гардероба" },
      { name: "description", content: "ИИ-стилист, который собирает образы из вашей одежды и объясняет, почему они работают." },
      { property: "og:title", content: "Flair — ваш ИИ-стилист гардероба" },
      { property: "og:description", content: "Осмысленные образы из вещей, которые у вас уже есть." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [email2, setEmail2] = useState("");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/wardrobe" });
  }, [user, loading, navigate]);

  const goAuth = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/auth", search: { email } as any });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1100px] px-6">
        {/* Nav */}
        <header className="flex items-center justify-between py-6">
          <span className="font-serif text-2xl tracking-tight">Flair</span>
          <Link to="/auth" className="text-sm hover:text-accent">Войти</Link>
        </header>

        {/* Hero */}
        <section className="min-h-[85vh] flex flex-col justify-center max-w-2xl mx-auto text-center py-20">
          <h1 className="font-serif text-5xl md:text-6xl leading-[1.05] tracking-tight">
            Ваш гардероб.<br />
            <span className="italic text-accent">Осмысленные образы.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-lg mx-auto">
            ИИ-стилист, который собирает образы из ВАШЕЙ одежды и точно объясняет, почему они работают.
          </p>
          <form onSubmit={goAuth} className="mt-10 flex flex-col sm:flex-row gap-3 max-w-md mx-auto w-full">
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com" className="input-field flex-1"
            />
            <button type="submit" className="btn-primary whitespace-nowrap">Получить ранний доступ</button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">Бесплатно для начала · Без карты</p>
        </section>

        {/* How it works */}
        <section className="py-20">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { Icon: Upload, title: "Добавьте одежду", body: "Фото за фото — мы соберём ваш цифровой гардероб." },
              { Icon: Calendar, title: "Выберите повод", body: "Работа, свидание, свадьба, путешествие — на ваш выбор." },
              { Icon: Sparkles, title: "Получите образы и объяснение", body: "Не просто комбинации. Настоящие пояснения стилиста." },
            ].map(({ Icon, title, body }, i) => (
              <div key={i} className="card-soft p-8">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-5">
                  <Icon size={22} className="text-accent" />
                </div>
                <h3 className="font-serif text-2xl mb-2">{title}</h3>
                <p className="text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Difference */}
        <section className="py-20 max-w-3xl mx-auto">
          <h2 className="font-serif text-4xl md:text-5xl leading-tight">
            К каждому образу — <span className="italic">объяснение</span>.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Большинство приложений просто перемешивают вещи. Flair объясняет, ПОЧЕМУ комбинация работает — цветовая гармония, пропорции, дресс-код. Как стилист-друг под рукой.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Теория цвета в применении к ВАШЕМУ гардеробу",
              "Подсказки по дресс-коду для любого события",
              "Логика образов, которой можно научиться",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-1 w-5 h-5 rounded-full bg-success flex items-center justify-center shrink-0">
                  <Check size={12} className="text-white" />
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Dark CTA */}
      <section className="bg-dark text-dark-foreground py-20 mt-10">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="font-serif text-4xl md:text-5xl">Запишитесь в лист ожидания.<br />Будьте первыми.</h2>
          <form onSubmit={(e) => { e.preventDefault(); navigate({ to: "/auth", search: { email: email2 } as any }); }} className="mt-8 flex flex-col sm:flex-row gap-3">
            <input
              type="email" required value={email2} onChange={(e) => setEmail2(e.target.value)}
              placeholder="you@email.com"
              className="flex-1 px-5 py-3.5 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 outline-none focus:border-accent"
            />
            <button className="btn-primary">Записаться</button>
          </form>
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-muted-foreground">Flair © 2024</footer>
    </div>
  );
}
