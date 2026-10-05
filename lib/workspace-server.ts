import { env } from "cloudflare:workers";
import { workspaceSchema } from "@/db/workspace-schema";
import { demoDirectory, type DemoSession } from "./demo-accounts";

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
let initialized: Promise<unknown> | undefined;
export async function workspaceDb() {
  if (!env.DB) throw new ApiError(503, "Workspace database is unavailable.");
  const db = env.DB;
  initialized ??= db.batch(workspaceSchema.map(sql => db.prepare(sql))).catch(error => { initialized = undefined; throw error; });
  await initialized;
  return db;
}
export function requireSameOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) throw new ApiError(403, "Request origin is not allowed.");
}
export async function tokenHash(token: string) { return [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)))].map(value => value.toString(16).padStart(2, "0")).join(""); }
export function sessionToken(request: Request) { return request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith("campus_session="))?.slice("campus_session=".length) ?? ""; }
export async function requireAccount(request: Request): Promise<DemoSession> {
  const token = sessionToken(request);
  if (!/^[a-f0-9]{64}$/.test(token)) throw new ApiError(401, "Please sign in to your campus account.");
  const db = await workspaceDb();
  const row = await db.prepare("SELECT account_id FROM workspace_sessions WHERE token_hash=? AND expires_at>?").bind(await tokenHash(token), Date.now()).first<{ account_id: string }>();
  if (!row || !demoDirectory[row.account_id]) throw new ApiError(401, "Your session expired. Please sign in again.");
  return demoDirectory[row.account_id];
}
export async function jsonBody(request: Request) {
  const body = await request.text();
  if (body.length > 50000) throw new ApiError(413, "The submitted data is too large.");
  try { return JSON.parse(body); } catch { throw new ApiError(400, "Invalid JSON."); }
}
export async function api(action: () => Promise<Response>) {
  try { return await action(); } catch (error) {
    if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    console.error("Workspace request failed", error);
    return Response.json({ error: "Could not access the workspace database. Please retry." }, { status: 500 });
  }
}
export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { "Cache-Control": "no-store" } }); }
