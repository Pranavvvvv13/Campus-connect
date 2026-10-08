import { workspaceSchema } from "@/db/workspace-schema";
import { demoDirectory, type DemoSession } from "./demo-accounts";
import path from "node:path";
import fs from "node:fs";

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }

interface D1PreparedStatement {
  bind(...args: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean; meta: { changes: number } }>;
}

interface D1DatabaseLike {
  prepare(sql: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

let dbInstance: D1DatabaseLike | null = null;
let initialized: Promise<unknown> | undefined;

async function getDatabaseInstance(): Promise<D1DatabaseLike> {
  if (dbInstance) return dbInstance;

  // 1. Try Cloudflare Workers environment if available
  try {
    const { env } = await import("cloudflare:workers");
    if (env && (env as any).DB) {
      dbInstance = (env as any).DB as D1DatabaseLike;
      return dbInstance;
    }
  } catch {
    // Not running in Cloudflare Workers
  }

  // 2. Fallback to Node.js built-in SQLite (Node 22+)
  try {
    const { DatabaseSync } = await import("node:sqlite");
    const dir = path.join(process.cwd(), ".wrangler", "state");
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // Ignored if permissions are restricted or created concurrently
      }
    }
    const dbPath = path.join(dir, "local.sqlite");
    let rawDb: any;
    try {
      rawDb = new DatabaseSync(dbPath);
    } catch {
      const fallbackDir = path.join(process.cwd(), ".db");
      if (!fs.existsSync(fallbackDir)) {
        try {
          fs.mkdirSync(fallbackDir, { recursive: true });
        } catch {
          // Ignored
        }
      }
      rawDb = new DatabaseSync(path.join(fallbackDir, "local.sqlite"));
    }

    class NodeD1Statement implements D1PreparedStatement {
      private stmt: any;
      private params: unknown[];
      constructor(stmt: any, params: unknown[] = []) {
        this.stmt = stmt;
        this.params = params;
      }
      bind(...args: unknown[]) {
        return new NodeD1Statement(this.stmt, args);
      }
      async first<T = unknown>(): Promise<T | null> {
        const row = this.stmt.get(...this.params);
        return (row as T) ?? null;
      }
      async all<T = unknown>(): Promise<{ results: T[] }> {
        const rows = this.stmt.all(...this.params);
        return { results: (rows as T[]) ?? [] };
      }
      async run(): Promise<{ success: boolean; meta: { changes: number } }> {
        const info = this.stmt.run(...this.params) as { changes?: number } | undefined;
        return { success: true, meta: { changes: Number(info?.changes ?? 0) } };
      }
    }

    class NodeD1Database implements D1DatabaseLike {
      constructor(private db: any) {}
      prepare(sql: string) {
        return new NodeD1Statement(this.db.prepare(sql));
      }
      async batch(statements: D1PreparedStatement[]) {
        const results = [];
        for (const s of statements) {
          results.push(await s.run());
        }
        return results;
      }
    }

    dbInstance = new NodeD1Database(rawDb);
    return dbInstance;
  } catch (err) {
    console.error("Local database initialization failed:", err);
    throw new ApiError(503, "Workspace database is unavailable.");
  }
}

export async function workspaceDb(): Promise<D1DatabaseLike> {
  const db = await getDatabaseInstance();
  initialized ??= db.batch(workspaceSchema.map(sql => db.prepare(sql))).catch(error => { initialized = undefined; throw error; });
  await initialized;
  return db;
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("host");
  const url = new URL(request.url);
  const isLoopback = (h: string) => h.startsWith("localhost") || h.startsWith("127.0.0.1");
  let originHost = "";
  try { originHost = new URL(origin).host; } catch { throw new ApiError(403, "Request origin is not allowed."); }
  const allowed = origin === url.origin ||
    originHost === host ||
    originHost === url.host ||
    (isLoopback(originHost) && (isLoopback(host ?? "") || isLoopback(url.host)));
  if (!allowed) throw new ApiError(403, "Request origin is not allowed.");
}

export async function tokenHash(token: string) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)))].map(value => value.toString(16).padStart(2, "0")).join("");
}

export function sessionToken(request: Request) {
  return request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith("campus_session="))?.slice("campus_session=".length) ?? "";
}

export async function requireAccount(request: Request): Promise<DemoSession> {
  const token = sessionToken(request);
  if (!/^[a-f0-9]{64}$/.test(token)) throw new ApiError(401, "Please sign in to your campus account.");
  const db = await workspaceDb();
  const row = await db.prepare("SELECT account_id FROM workspace_sessions WHERE token_hash=? AND expires_at>?").bind(await tokenHash(token), Date.now()).first<{ account_id: string }>();
  if (!row || !demoDirectory[row.account_id]) throw new ApiError(401, "Your session expired. Please sign in again.");
  const status = await db.prepare("SELECT suspended FROM workspace_account_status WHERE account_id=?").bind(row.account_id).first<{ suspended: number }>();
  if (status?.suspended) throw new ApiError(403, "Your account is suspended. Contact the campus administrator.");
  const preferences=await db.prepare("SELECT display_name FROM workspace_user_preferences WHERE account_id=?").bind(row.account_id).first<{display_name:string}>();
  return {...demoDirectory[row.account_id],name:preferences?.display_name||demoDirectory[row.account_id].name};
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

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
