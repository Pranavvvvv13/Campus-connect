import { demoDirectory } from "@/lib/demo-accounts";
import { mockStudents, type StudentPortfolio } from "@/lib/student-directory";
import { profileSchema } from "@/lib/workspace-model";
import { api, ApiError, json, requireAccount, workspaceDb } from "@/lib/workspace-server";

export const dynamic = "force-dynamic";
export async function GET(request: Request) { return api(async () => {
  const account = await requireAccount(request);
  if (account.role !== "Faculty" && account.role !== "Admin") throw new ApiError(403,"Only faculty and administrators can view student portfolios.");
  const db = await workspaceDb();
  const rows = await db.prepare("SELECT account_id,profile_json FROM workspace_profiles").all<{account_id:string;profile_json:string}>();
  const students: StudentPortfolio[] = rows.results.flatMap(row=> {
    const person = demoDirectory[row.account_id];
    const parsed = profileSchema.safeParse(JSON.parse(row.profile_json));
    if (person?.role !== "Student" || !parsed.success || !parsed.data.facultyVisible) return [];
    const {headline,about,skills,github,linkedin,website,projects,achievements,department,year} = parsed.data;
    return [{id:person.universityId,name:person.name,department,year,mock:false,portfolio:{headline,about,skills,github,linkedin,website,projects,achievements}}];
  });
  return json({students:[...students,...mockStudents]});
}); }
