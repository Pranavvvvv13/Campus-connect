import { turnstileConfig } from "@/lib/turnstile";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const local = import.meta.env.DEV && ["localhost", "127.0.0.1", "[::1]"].includes(new URL(request.url).hostname);
  const { siteKey, testMode } = await turnstileConfig(local);
  return Response.json({ siteKey, testMode }, { headers: { "Cache-Control": "no-store" } });
}
