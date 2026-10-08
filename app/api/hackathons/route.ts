import { loadHackathons } from "@/lib/hackathon-providers";
import { loadLinkedInEvents } from "@/lib/linkedin-events";
import { workspaceDb } from "@/lib/workspace-server";
import type { Hackathon } from "@/lib/hackathons";

export const dynamic = "force-dynamic";

export async function GET() {
  const [feed,linkedin]=await Promise.all([loadHackathons(),loadLinkedInEvents()]);
  let manual:Hackathon[]=[];
  try {
    const db=await workspaceDb();
    const rows=await db.prepare("SELECT event_json FROM workspace_linkedin_events").all<{event_json:string}>();
    manual=rows.results.map(row=>JSON.parse(row.event_json) as Hackathon).filter(event=>Date.parse(event.endsAt??event.startsAt??"")>Date.now());
  } catch { linkedin.provider.message="Manually maintained LinkedIn events could not be loaded."; }
  const urls=new Set(linkedin.events.map(event=>event.href.replace(/\/$/,"")));
  const additions=[...linkedin.events,...manual.filter(event=>!urls.has(event.href.replace(/\/$/,"")))];
  feed.events.push(...additions);
  feed.providers.push({...linkedin.provider,count:additions.length});
  return Response.json(feed, { status: !feed.events.length && !feed.providers.some(provider => provider.status === "ok") ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
