import { z } from "zod";
import { api, ApiError, json, jsonBody, requireAccount, requireSameOrigin, workspaceDb } from "@/lib/workspace-server";
import { linkedInConfigured } from "@/lib/linkedin-events";
import { normalizeCity } from "@/lib/event-location";
import type { Hackathon } from "@/lib/hackathons";
export const dynamic="force-dynamic";
async function admin(request:Request) { const account=await requireAccount(request);if(account.role!=="Admin")throw new ApiError(403,"Administrator access required.");return account; }
const date=z.string().datetime({offset:true});
const schema=z.object({title:z.string().trim().min(2).max(200),host:z.string().trim().min(2).max(200),href:z.string().url().max(1000).refine(value=>{const url=new URL(value);return url.protocol==="https:"&&["linkedin.com","www.linkedin.com"].includes(url.hostname)&&/^\/events\/[^/]+/.test(url.pathname);}),mode:z.enum(["Online","Offline","Hybrid"]),location:z.string().trim().max(200),startsAt:date,endsAt:date,description:z.string().trim().max(2000),imageUrl:z.string().max(2000).refine(value=>{if(!value)return true;try{const url=new URL(value);return url.protocol==="https:"&&(url.hostname==="media.licdn.com"||url.hostname==="media-exp1.licdn.com");}catch{return false;}})}).refine(event=>Date.parse(event.endsAt)>Date.parse(event.startsAt),"End must follow start").refine(event=>event.mode==="Online"||Boolean(event.location),"In-person events need a venue");
export async function GET(request:Request) {return api(async()=>{await admin(request);const db=await workspaceDb();const rows=await db.prepare("SELECT event_json FROM workspace_linkedin_events ORDER BY updated_at DESC").all<{event_json:string}>();return json({events:rows.results.map(row=>JSON.parse(row.event_json)),configured:linkedInConfigured()});});}
export async function POST(request:Request) {return api(async()=>{
  requireSameOrigin(request);const actor=await admin(request);const parsed=schema.safeParse(await jsonBody(request));
  if(!parsed.success)throw new ApiError(400,"Provide a LinkedIn event URL, title, organizer, valid dates and venue. Banner URLs must use LinkedIn's media host.");
  const input=parsed.data;
  if(Date.parse(input.endsAt)<=Date.now())throw new ApiError(400,"Add an upcoming or ongoing event.");
  const href=new URL(input.href);href.search="";href.hash="";
  const id=`linkedin-manual-${await crypto.subtle.digest("SHA-256",new TextEncoder().encode(href.href.replace(/\/$/,""))).then(hash=>Array.from(new Uint8Array(hash)).map(byte=>byte.toString(16).padStart(2,"0")).join("").slice(0,24))}`;
  const event:Hackathon={...input,id,href:href.href,source:"LinkedIn",location:input.mode==="Online"?null:normalizeCity(input.location),deadline:null,tags:["Community event"],imageUrl:input.imageUrl||null,imageKind:"banner",syncKind:"manual"};
  const db=await workspaceDb();const updatedAt=new Date().toISOString();
  await db.batch([db.prepare("INSERT INTO workspace_linkedin_events(id,event_json,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET event_json=excluded.event_json,updated_at=excluded.updated_at").bind(id,JSON.stringify(event),updatedAt),db.prepare("INSERT INTO workspace_audit(id,actor_id,target_id,action,reason,created_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),actor.universityId,id,"save_linkedin_event",input.title,updatedAt)]);
  return json({event});
});}
export async function DELETE(request:Request) {return api(async()=>{
  requireSameOrigin(request);const actor=await admin(request);const parsed=z.object({id:z.string().regex(/^linkedin-manual-[a-f0-9]{24}$/)}).safeParse(await jsonBody(request));
  if(!parsed.success)throw new ApiError(400,"Select a valid manually maintained event.");
  const {id}=parsed.data;const db=await workspaceDb();
  await db.batch([db.prepare("DELETE FROM workspace_linkedin_events WHERE id=?").bind(id),db.prepare("INSERT INTO workspace_audit(id,actor_id,target_id,action,reason,created_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),actor.universityId,id,"remove_linkedin_event","Removed manually maintained event",new Date().toISOString())]);return json({ok:true});
});}
