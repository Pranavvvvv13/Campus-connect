import { loadUnstopBanner } from "@/lib/hackathon-providers";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
  const id=new URL(request.url).searchParams.get("id")??"";
  if(!/^\d{1,12}$/.test(id))return Response.json({error:"Invalid event ID"},{status:400});
  try {return Response.json({imageUrl:await loadUnstopBanner(id)},{headers:{"Cache-Control":"public, max-age=1800"}});}
  catch {return Response.json({imageUrl:null},{status:503,headers:{"Cache-Control":"no-store"}});}
}
