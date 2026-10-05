import { z } from "zod";
import { eventSchema } from "@/lib/workspace-model";
import { api, ApiError, json, jsonBody, requireAccount, requireSameOrigin, workspaceDb } from "@/lib/workspace-server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return api(async () => {
  const account = await requireAccount(request); const db = await workspaceDb();
  const rows = await db.prepare("SELECT event_json,reminder_days,saved_at FROM workspace_bookmarks WHERE account_id=? ORDER BY saved_at DESC").bind(account.universityId).all<{event_json:string;reminder_days:number;saved_at:string}>();
  return json({ bookmarks: rows.results.map(row => ({ event: JSON.parse(row.event_json), reminderDays: row.reminder_days, savedAt: row.saved_at })) });
}); }
export async function PUT(request: Request) { return api(async () => {
  requireSameOrigin(request); const account = await requireAccount(request);
  const parsed = z.object({ event: eventSchema, reminderDays: z.union([z.literal(0),z.literal(1),z.literal(3),z.literal(7)]) }).safeParse(await jsonBody(request));
  if (!parsed.success) throw new ApiError(400, "Invalid hackathon or reminder setting.");
  const db = await workspaceDb(); const { event, reminderDays } = parsed.data;
  await db.prepare("INSERT INTO workspace_bookmarks(account_id,event_id,event_json,reminder_days,saved_at) VALUES(?,?,?,?,?) ON CONFLICT(account_id,event_id) DO UPDATE SET event_json=excluded.event_json,reminder_days=excluded.reminder_days").bind(account.universityId,event.id,JSON.stringify(event),reminderDays,new Date().toISOString()).run();
  return json({ ok:true });
}); }
export async function DELETE(request: Request) { return api(async () => {
  requireSameOrigin(request); const account = await requireAccount(request); const body = await jsonBody(request);
  if (typeof body.id !== "string" || body.id.length > 100) throw new ApiError(400,"Invalid bookmark.");
  const db = await workspaceDb(); await db.prepare("DELETE FROM workspace_bookmarks WHERE account_id=? AND event_id=?").bind(account.universityId,body.id).run(); return json({ok:true});
}); }
