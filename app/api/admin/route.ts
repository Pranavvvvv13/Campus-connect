import { z } from "zod";
import { demoDirectory } from "@/lib/demo-accounts";
import { profileSchema } from "@/lib/workspace-model";
import { api, ApiError, json, jsonBody, requireAccount, requireSameOrigin, workspaceDb } from "@/lib/workspace-server";
export const dynamic="force-dynamic";
async function admin(request:Request){const account=await requireAccount(request);if(account.role!=="Admin")throw new ApiError(403,"Administrator access required.");return account;}
export async function GET(request:Request){return api(async()=>{
  await admin(request);const db=await workspaceDb();
  const [statuses,sessions,profiles,audit,bookmarks,requests]=await Promise.all([
    db.prepare("SELECT account_id,suspended FROM workspace_account_status").all<{account_id:string;suspended:number}>(),
    db.prepare("SELECT account_id,COUNT(*) AS count FROM workspace_sessions WHERE expires_at>? GROUP BY account_id").bind(Date.now()).all<{account_id:string;count:number}>(),
    db.prepare("SELECT account_id,profile_json,updated_at FROM workspace_profiles").all<{account_id:string;profile_json:string;updated_at:string}>(),
    db.prepare("SELECT * FROM workspace_audit ORDER BY created_at DESC LIMIT 100").all<{id:string;actor_id:string;target_id:string;action:string;reason:string;created_at:string}>(),
    db.prepare("SELECT COUNT(*) AS count FROM workspace_bookmarks").first<{count:number}>(),
    db.prepare("SELECT COUNT(*) AS count FROM workspace_team_requests WHERE status='pending'").first<{count:number}>(),
  ]);
  const preferences=await db.prepare("SELECT account_id,display_name FROM workspace_user_preferences").all<{account_id:string;display_name:string}>();
  const displayNames=new Map(preferences.results.map(row=>[row.account_id,row.display_name]));
  const accounts=Object.values(demoDirectory).map(original=>{
    const person={...original,name:displayNames.get(original.universityId)||original.name};
    const row=profiles.results.find(row=>row.account_id===person.universityId);
    const profile=row?profileSchema.safeParse(JSON.parse(row.profile_json)):null;
    return {id:person.universityId,name:person.name,email:person.email,role:person.role,suspended:Boolean(statuses.results.find(row=>row.account_id===person.universityId)?.suspended),sessions:sessions.results.find(row=>row.account_id===person.universityId)?.count??0,portfolioUpdatedAt:row?.updated_at??null,sharedWithFaculty:profile?.success?profile.data.facultyVisible:false,projects:profile?.success?profile.data.projects.length:0,achievements:profile?.success?profile.data.achievements.length:0};
  });
  return json({accounts,activity:audit.results.map(row=>({id:row.id,actor:demoDirectory[row.actor_id]?.name??row.actor_id,target:demoDirectory[row.target_id]?.name??row.target_id,action:row.action,reason:row.reason,createdAt:row.created_at})),metrics:{accounts:accounts.length,activeSessions:accounts.reduce((sum,account)=>sum+account.sessions,0),portfolios:accounts.filter(account=>account.portfolioUpdatedAt).length,sharedPortfolios:accounts.filter(account=>account.role==="Student"&&account.sharedWithFaculty).length,bookmarks:bookmarks?.count??0,teamRequests:requests?.count??0},updatedAt:new Date().toISOString()});
});}
export async function PATCH(request:Request){return api(async()=>{
  requireSameOrigin(request);const actor=await admin(request);
  const parsed=z.object({accountId:z.string(),action:z.enum(["suspend","restore","revoke_sessions"]),reason:z.string().trim().min(3).max(300)}).safeParse(await jsonBody(request));
  if(!parsed.success)throw new ApiError(400,"Select an account and provide a reason (3–300 characters).");
  const {accountId,action,reason}=parsed.data;
  if(!demoDirectory[accountId])throw new ApiError(404,"Account not found.");
  if(accountId===actor.universityId || demoDirectory[accountId].role==="Admin")throw new ApiError(400,"Administrator accounts cannot be changed here.");
  const db=await workspaceDb();
  const statements=[];
  if(action!=="revoke_sessions")statements.push(db.prepare("INSERT INTO workspace_account_status(account_id,suspended) VALUES(?,?) ON CONFLICT(account_id) DO UPDATE SET suspended=excluded.suspended").bind(accountId,action==="suspend"?1:0));
  if(action!=="restore")statements.push(db.prepare("DELETE FROM workspace_sessions WHERE account_id=?").bind(accountId));
  statements.push(db.prepare("INSERT INTO workspace_audit(id,actor_id,target_id,action,reason,created_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),actor.universityId,accountId,action,reason,new Date().toISOString()));
  await db.batch(statements);return json({ok:true});
});}
