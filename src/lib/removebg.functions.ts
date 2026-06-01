import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Remove.bg API proxy — keeps the API key server-side.
export const removeBackground = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { imageBase64: string; filename?: string }) => {
    if (!input?.imageBase64 || typeof input.imageBase64 !== "string") {
      throw new Error("imageBase64 is required");
    }
    if (input.imageBase64.length > 15_000_000) {
      throw new Error("Image too large");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.REMOVE_BG_API_KEY || "PDxZCD3kKniPqeCs5SULBrbX";

    // Decode base64 -> bytes -> Blob for multipart upload
    const binary = atob(data.imageBase64.split(',')[1] || data.imageBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes]);

    const form = new FormData();
    form.append("image_file", blob, data.filename || "image.jpg");
    form.append("size", "auto");
    form.append("format", "png");

    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: form,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Remove.bg failed: ${res.status} ${text.slice(0, 200)}`);
    }

    const buf = new Uint8Array(await res.arrayBuffer());
    let b64 = "";
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      b64 += String.fromCharCode(...buf.subarray(i, i + chunk));
    }
    return { pngBase64: `data:image/png;base64,${btoa(b64)}` };
  });
