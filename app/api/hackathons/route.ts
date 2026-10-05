import { loadHackathons } from "@/lib/hackathon-providers";

export const dynamic = "force-dynamic";

export async function GET() {
  const feed = await loadHackathons();
  return Response.json(feed, { status: feed.providers.every(provider => provider.status === "unavailable") ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
