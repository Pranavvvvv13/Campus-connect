import { z } from "zod";
import { api, ApiError, json, jsonBody, requireAccount, requireSameOrigin, workspaceDb } from "@/lib/workspace-server";
export const dynamic="force-dynamic";
export async function GET(request:Request){return api(async()=>json({account:await requireAccount(request)}));}
export async function PATCH(request:Request){return api(async()=>{
  requireSameOrigin(request);const account=await requireAccount(request);
  const parsed=z.object({name:z.string().trim().min(2,"Use at least 2 characters.").max(80,"Use at most 80 characters.").refine(value=>!/[\u0000-\u001f\u007f]/.test(value),"Use a name without control characters.")}).strict().safeParse(await jsonBody(request));
  if(!parsed.success)throw new ApiError(400,parsed.error.issues[0].message);
  const name=parsed.data.name.replace(/\s+/g," ");const db=await workspaceDb();
  await db.prepare("INSERT INTO workspace_user_preferences(account_id,display_name) VALUES(?,?) ON CONFLICT(account_id) DO UPDATE SET display_name=excluded.display_name").bind(account.universityId,name).run();
  return json({account:{...account,name}});
});}
