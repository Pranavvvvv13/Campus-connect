import { z } from "zod";
import { demoDirectory } from "@/lib/demo-accounts";
import type { Profile } from "@/lib/workspace-model";
import { api, ApiError, json, jsonBody, requireAccount, requireSameOrigin, workspaceDb } from "@/lib/workspace-server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return api(async () => {
  const account = await requireAccount(request); const db = await workspaceDb();
  const profiles = await db.prepare("SELECT account_id,profile_json FROM workspace_profiles").all<{account_id:string;profile_json:string}>();
  const members = profiles.results.flatMap(row => {
    const profile: Profile = JSON.parse(row.profile_json); const person = demoDirectory[row.account_id];
    return profile.teamVisible && person ? [{ id:row.account_id,name:person.name,role:person.role,headline:profile.headline,skills:profile.skills,city:profile.city,interests:profile.interests,lookingFor:profile.lookingFor,github:profile.github,website:profile.website }] : [];
  });
  const rows = await db.prepare("SELECT * FROM workspace_team_requests WHERE from_id=? OR to_id=? ORDER BY created_at DESC").bind(account.universityId,account.universityId).all<{id:string;from_id:string;to_id:string;status:string;created_at:string}>();
  return json({ members, accountId:account.universityId, requests: rows.results.map(row => ({id:row.id,fromId:row.from_id,toId:row.to_id,fromName:demoDirectory[row.from_id]?.name ?? "Campus member",toName:demoDirectory[row.to_id]?.name ?? "Campus member",status:row.status,createdAt:row.created_at})) });
}); }
export async function POST(request: Request) { return api(async () => {
  requireSameOrigin(request); const account = await requireAccount(request);
  const parsed = z.object({ toId:z.string().max(100) }).safeParse(await jsonBody(request));
  if (!parsed.success || !demoDirectory[parsed.data.toId] || parsed.data.toId===account.universityId) throw new ApiError(400,"Choose another available team member.");
  const db = await workspaceDb();
  const target = await db.prepare("SELECT profile_json FROM workspace_profiles WHERE account_id=?").bind(parsed.data.toId).first<{profile_json:string}>();
  const sender = await db.prepare("SELECT profile_json FROM workspace_profiles WHERE account_id=?").bind(account.universityId).first<{profile_json:string}>();
  if (!target || !JSON.parse(target.profile_json).teamVisible || !sender || !JSON.parse(sender.profile_json).teamVisible) throw new ApiError(400,"Both people must opt in to Team finder first.");
  const existing = await db.prepare("SELECT id,status FROM workspace_team_requests WHERE (from_id=? AND to_id=?) OR (from_id=? AND to_id=?)").bind(account.universityId,parsed.data.toId,parsed.data.toId,account.universityId).first<{id:string;status:string}>();
  if (existing && existing.status!=="declined") throw new ApiError(409,"A request or connection already exists between you.");
  if (existing) throw new ApiError(409,"This team request was declined. Please choose another teammate.");
  await db.prepare("INSERT INTO workspace_team_requests(id,from_id,to_id,created_at) VALUES(?,?,?,?)").bind(crypto.randomUUID(),account.universityId,parsed.data.toId,new Date().toISOString()).run();
  return json({ok:true},201);
}); }
export async function PATCH(request: Request) { return api(async () => {
  requireSameOrigin(request); const account = await requireAccount(request);
  const parsed = z.object({id:z.string().uuid(),status:z.enum(["accepted","declined"])}).safeParse(await jsonBody(request));
  if (!parsed.success) throw new ApiError(400,"Invalid request response.");
  const db = await workspaceDb();
  const result = await db.prepare("UPDATE workspace_team_requests SET status=? WHERE id=? AND to_id=? AND status='pending'").bind(parsed.data.status,parsed.data.id,account.universityId).run();
  if (!result.meta.changes) throw new ApiError(404,"Pending request not found.");
  return json({ok:true});
}); }
export async function DELETE(request: Request) { return api(async () => {
  requireSameOrigin(request); const account = await requireAccount(request);
  const parsed=z.object({id:z.string().uuid()}).safeParse(await jsonBody(request));
  if(!parsed.success)throw new ApiError(400,"Invalid team request.");
  const db=await workspaceDb();
  const result=await db.prepare("DELETE FROM workspace_team_requests WHERE id=? AND (from_id=? OR (to_id=? AND status='accepted'))").bind(parsed.data.id,account.universityId,account.universityId).run();
  if(!result.meta.changes)throw new ApiError(404,"Request or connection not found.");
  return json({ok:true});
}); }
