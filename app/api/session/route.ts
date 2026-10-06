import { demoDirectory } from "@/lib/demo-accounts";
import { api, ApiError, json, jsonBody, requireAccount, requireSameOrigin, sessionToken, tokenHash, workspaceDb } from "@/lib/workspace-server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return api(async () => json({ account: await requireAccount(request) })); }
export async function POST(request: Request) {
  return api(async () => {
    requireSameOrigin(request);
    const url = new URL(request.url);
    if (!import.meta.env.DEV || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw new ApiError(403, "Demo sign-in is available only in local development. Configure university authentication for deployment.");
    const body = await jsonBody(request);
    const account = demoDirectory[String(body.universityId ?? "").trim().toUpperCase()];
    if (!account || account.email.toLowerCase() !== String(body.email ?? "").trim().toLowerCase() || account.role !== body.role || body.code !== "246810") throw new ApiError(401, "The account details or verification code are incorrect.");
    const db = await workspaceDb();
    const status=await db.prepare("SELECT suspended FROM workspace_account_status WHERE account_id=?").bind(account.universityId).first<{suspended:number}>();
    if(status?.suspended)throw new ApiError(403,"Your account is suspended. Contact the campus administrator.");
    const token = [...crypto.getRandomValues(new Uint8Array(32))].map(value => value.toString(16).padStart(2, "0")).join("");
    const oldToken = sessionToken(request);
    await db.batch([
      db.prepare("DELETE FROM workspace_sessions WHERE expires_at<=? OR token_hash=?").bind(Date.now(), await tokenHash(oldToken)),
      db.prepare("INSERT INTO workspace_sessions(token_hash,account_id,expires_at) VALUES(?,?,?)").bind(await tokenHash(token), account.universityId, Date.now() + 7 * 86400000),
    ]);
    return Response.json({ account }, { headers: { "Cache-Control": "no-store", "Set-Cookie": `campus_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${url.protocol === "https:" ? "; Secure" : ""}` } });
  });
}
export async function DELETE(request: Request) { return api(async () => {
  requireSameOrigin(request);
  const db = await workspaceDb();
  await db.prepare("DELETE FROM workspace_sessions WHERE token_hash=?").bind(await tokenHash(sessionToken(request))).run();
  return Response.json({ ok: true }, { headers: { "Set-Cookie": "campus_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" } });
}); }
