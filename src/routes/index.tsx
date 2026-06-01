import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Upload, Calendar, Sparkles, Check } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flair — Your AI Wardrobe Stylist" },
      { name: "description", content: "AI stylist that picks outfits from your own clothes and explains why they work." },
      { property: "og:title", content: "Flair — Your AI Wardrobe Stylist" },
      { property: "og:description", content: "Outfits that make sense, from the clothes you already own." },
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
          <Link to="/auth" className="text-sm hover:text-accent">Sign In</Link>
        </header>

        {/* Hero */}
        <section className="min-h-[85vh] flex flex-col justify-center max-w-2xl mx-auto text-center py-20">
          <h1 className="font-serif text-5xl md:text-6xl leading-[1.05] tracking-tight">
            Your wardrobe.<br />
            <span className="italic text-accent">Outfits that make sense.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-lg mx-auto">
            AI stylist that picks outfits from YOUR clothes and explains exactly why they work.
          </p>
          <form onSubmit={goAuth} className="mt-10 flex flex-col sm:flex-row gap-3 max-w-md mx-auto w-full">
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com" className="input-field flex-1"
            />
            <button type="submit" className="btn-primary whitespace-nowrap">Get Early Access</button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">Free to start · No credit card needed</p>
        </section>

        {/* How it works */}
        <section className="py-20">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { Icon: Upload, title: "Add your clothes", body: "Photo by photo, we build your digital wardrobe." },
              { Icon: Calendar, title: "Choose the occasion", body: "Work, date, wedding, travel — you pick it." },
              { Icon: Sparkles, title: "Get outfits + why they work", body: "Not just combinations. Real styling explanations." },
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
            Every outfit comes with an <span className="italic">explanation</span>.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Most apps just shuffle your clothes. Flair tells you WHY each combination works — color harmony, proportions, dress code. Like having a stylist friend on call.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Color theory applied to YOUR wardrobe",
              "Dress code guidance for every event",
              "Outfit logic you can actually learn from",
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
          <h2 className="font-serif text-4xl md:text-5xl">Join the waitlist.<br />Be first.</h2>
          <form onSubmit={(e) => { e.preventDefault(); navigate({ to: "/auth", search: { email: email2 } as any }); }} className="mt-8 flex flex-col sm:flex-row gap-3">
            <input
              type="email" required value={email2} onChange={(e) => setEmail2(e.target.value)}
              placeholder="you@email.com"
              className="flex-1 px-5 py-3.5 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 outline-none focus:border-accent"
            />
            <button className="btn-primary">Join</button>
          </form>
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-muted-foreground">Flair © 2024</footer>
    </div>
  );
}
