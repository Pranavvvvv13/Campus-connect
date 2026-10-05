import { profileSchema } from "@/lib/workspace-model";
import { api, ApiError, json, jsonBody, requireAccount, requireSameOrigin, workspaceDb } from "@/lib/workspace-server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return api(async () => {
  const account = await requireAccount(request); const db = await workspaceDb();
  const row = await db.prepare("SELECT profile_json,updated_at FROM workspace_profiles WHERE account_id=?").bind(account.universityId).first<{profile_json:string;updated_at:string}>();
  return json({ profile: row ? JSON.parse(row.profile_json) : null, updatedAt: row?.updated_at ?? null });
}); }
export async function PUT(request: Request) { return api(async () => {
  requireSameOrigin(request); const account = await requireAccount(request);
  const parsed = profileSchema.safeParse(await jsonBody(request));
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);
  const profile = parsed.data; profile.skills = [...new Set(profile.skills.split(",").map(skill => skill.trim()).filter(Boolean))].join(", ");
  const db = await workspaceDb(); const updatedAt = new Date().toISOString();
  await db.prepare("INSERT INTO workspace_profiles(account_id,profile_json,updated_at) VALUES(?,?,?) ON CONFLICT(account_id) DO UPDATE SET profile_json=excluded.profile_json,updated_at=excluded.updated_at").bind(account.universityId, JSON.stringify(profile), updatedAt).run();
  return json({ profile, updatedAt });
}); }
