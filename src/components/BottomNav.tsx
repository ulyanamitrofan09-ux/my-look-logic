import { Link, useRouterState } from "@tanstack/react-router";
import { Shirt, Sparkles, Bookmark, User } from "lucide-react";

const tabs = [
  { to: "/wardrobe", label: "Wardrobe", Icon: Shirt },
  { to: "/outfits", label: "Outfits", Icon: Sparkles },
  { to: "/lookbook", label: "Lookbook", Icon: Bookmark },
  { to: "/profile", label: "Profile", Icon: User },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[428px] bg-card border-t border-border z-40">
      <div className="grid grid-cols-4">
        {tabs.map(({ to, label, Icon }) => {
          const active = path === to || path.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-1 py-3"
              style={{ color: active ? "var(--color-accent)" : "var(--color-muted-foreground)" }}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.6} />
              <span className="text-[11px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
