import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children, hideNav }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[428px] min-h-screen bg-background relative pb-24">
        {children}
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
