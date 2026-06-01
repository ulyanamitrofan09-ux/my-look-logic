import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ email: (s.email as string) || "" }),
  component: AuthPage,
});

function AuthPage() {
  const { email: initialEmail } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name }, emailRedirectTo: window.location.origin + "/wardrobe" },
        });
        if (error) throw error;
        toast.success("Welcome to Flair!");
        navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/wardrobe" });
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    try {
      const { lovable } = await import("@/integrations/lovable");
      const result = await (lovable as any).auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/wardrobe" });
      if (result?.error) toast.error("Google sign-in failed");
    } catch {
      toast.error("Google sign-in unavailable");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-6">
        <Link to="/" className="font-serif text-2xl">Flair</Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="card-soft p-8 w-full max-w-md">
          <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-full mb-6">
            {(["signup", "signin"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`py-2 rounded-full text-sm font-medium transition ${mode === m ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
                {m === "signup" ? "Sign Up" : "Sign In"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <input className="input-field" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
            )}
            <input className="input-field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className="input-field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            <button disabled={busy} type="submit" className="btn-primary w-full">
              {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> OR <div className="flex-1 h-px bg-border" />
          </div>

          <button onClick={google} className="btn-outline w-full">Continue with Google</button>
        </div>
      </div>
    </div>
  );
}
