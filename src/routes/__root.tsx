import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Flair — Your AI Wardrobe Stylist" },
      { name: "description", content: "AI stylist that picks outfits from YOUR clothes and explains exactly why they work." },
      { property: "og:title", content: "Flair — Your AI Wardrobe Stylist" },
      { name: "twitter:title", content: "Flair — Your AI Wardrobe Stylist" },
      { property: "og:description", content: "AI stylist that picks outfits from YOUR clothes and explains exactly why they work." },
      { name: "twitter:description", content: "AI stylist that picks outfits from YOUR clothes and explains exactly why they work." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e125f0ba-5112-45c0-b044-52799a49a29d/id-preview-d5c39618--fa846032-d98b-4e0b-907f-7c67c72061cc.lovable.app-1780425140279.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e125f0ba-5112-45c0-b044-52799a49a29d/id-preview-d5c39618--fa846032-d98b-4e0b-907f-7c67c72061cc.lovable.app-1780425140279.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
