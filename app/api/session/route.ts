import { demoDirectory } from "@/lib/demo-accounts";
import { demoLoginConfig } from "@/lib/demo-login";
import { turnstileConfig, verifyTurnstile } from "@/lib/turnstile";
import { api, ApiError, json, jsonBody, requireAccount, requireSameOrigin, sessionToken, tokenHash, workspaceDb } from "@/lib/workspace-server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return api(async () => json({ account: await requireAccount(request) })); }
export async function POST(request: Request) {
  return api(async () => {
    requireSameOrigin(request);
    const url = new URL(request.url);
    const body = await jsonBody(request);
    const local = import.meta.env.DEV && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    const hostedDemo = await demoLoginConfig();
    if (!local && !hostedDemo.enabled) throw new ApiError(403, "Teacher demo access needs to be enabled by the site owner.");
    const captcha = await turnstileConfig(local);
    if (!await verifyTurnstile(body.captchaToken, captcha.secret, url.hostname, captcha.testMode)) throw new ApiError(400, "CAPTCHA verification failed or expired. Please complete it again.");
    const email = String(body.email ?? "").trim().toLowerCase();
    const account = Object.values(demoDirectory).find(person => person.email.toLowerCase() === email);
    const passwordLogin = typeof body.password === "string";
    if (!local && (!passwordLogin || account?.universityId !== "STU-2026-001")) throw new ApiError(401, "Use the student demo account shared by the project owner.");
    if (!account || account.role !== body.role || (passwordLogin ? body.password !== (local ? "123" : hostedDemo.password) : body.code !== "246810" || account.universityId !== String(body.universityId ?? "").trim().toUpperCase())) throw new ApiError(401, "The email or password is incorrect for this portal.");
    const db = await workspaceDb();
    const status=await db.prepare("SELECT suspended FROM workspace_account_status WHERE account_id=?").bind(account.universityId).first<{suspended:number}>();
    if(status?.suspended)throw new ApiError(403,"Your account is suspended. Contact the campus administrator.");
    const token = [...crypto.getRandomValues(new Uint8Array(32))].map(value => value.toString(16).padStart(2, "0")).join("");
    const oldToken = sessionToken(request);
    await db.batch([
      db.prepare("DELETE FROM workspace_sessions WHERE expires_at<=? OR token_hash=?").bind(Date.now(), await tokenHash(oldToken)),
      db.prepare("INSERT INTO workspace_sessions(token_hash,account_id,expires_at) VALUES(?,?,?)").bind(await tokenHash(token), account.universityId, Date.now() + 7 * 86400000),
    ]);
    const preferences=await db.prepare("SELECT display_name FROM workspace_user_preferences WHERE account_id=?").bind(account.universityId).first<{display_name:string}>();
    return Response.json({ account:{...account,name:preferences?.display_name||account.name} }, { headers: { "Cache-Control": "no-store", "Set-Cookie": `campus_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${url.protocol === "https:" ? "; Secure" : ""}` } });
  });
}
export async function DELETE(request: Request) { return api(async () => {
  requireSameOrigin(request);
  const db = await workspaceDb();
  await db.prepare("DELETE FROM workspace_sessions WHERE token_hash=?").bind(await tokenHash(sessionToken(request))).run();
  return Response.json({ ok: true }, { headers: { "Set-Cookie": "campus_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" } });
}); }
