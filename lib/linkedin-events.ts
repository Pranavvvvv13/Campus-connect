import type { Hackathon, HackathonFeed } from "./hackathons";

type Localized = { localized?: Record<string,string>; preferredLocale?: {language:string;country:string} };
type LinkedInEvent = {
  id: string | number; name?: Localized; description?: Localized; vanityName?: string;
  startsAt?: number; endsAt?: number; cancelled?: boolean; isCancelled?:boolean;
  type?: { online?: {format?:{liveVideo?:{endsAt?:number};external?:{endsAt?:number}}}; inPerson?: {endsAt?:number;location?: {name?:string;address?:{city?:string}}} };
};
function localized(value?: Localized) {
  const locale=value?.preferredLocale;
  return (locale ? value?.localized?.[`${locale.language}_${locale.country}`] : null) ?? value?.localized?.en_US ?? Object.values(value?.localized??{})[0] ?? "";
}
function timestamp(value?:number) { return value && Number.isFinite(value) ? new Date(value).toISOString() : null; }
export function parseLinkedInEvent(event: LinkedInEvent, now=Date.now()):Hackathon|null {
  const title=localized(event.name);
  const end=event.endsAt??event.type?.inPerson?.endsAt??event.type?.online?.format?.liveVideo?.endsAt??event.type?.online?.format?.external?.endsAt;
  if (!title || !/^\d+$/.test(String(event.id)) || event.cancelled || event.isCancelled || (end??event.startsAt??0)<=now) return null;
  return {id:`linkedin-${event.id}`,title,host:"LinkedIn organization event",source:"LinkedIn",href:`https://www.linkedin.com/events/${event.id}/`,mode:event.type?.inPerson?"Offline":"Online",location:event.type?.inPerson?.location?.address?.city??event.type?.inPerson?.location?.name??null,startsAt:timestamp(event.startsAt),endsAt:timestamp(end),deadline:null,tags:["Community event"],description:localized(event.description).slice(0,2000),syncKind:"automatic"};
}
export function linkedInConfigured() {
  return Boolean(process.env.LINKEDIN_ACCESS_TOKEN && /^\d+$/.test(process.env.LINKEDIN_ORGANIZATION_ID??"") && /^20\d{4}$/.test(process.env.LINKEDIN_API_VERSION??""));
}
export async function loadLinkedInEvents():Promise<{events:Hackathon[];provider:HackathonFeed["providers"][number]}> {
  if(!linkedInConfigured())return {events:[],provider:{name:"LinkedIn",status:"not_configured",count:0,message:"Automatic sync needs approved LinkedIn Events API access. Admin-added events are manually maintained."}};
  try {
    const events:Hackathon[]=[];
    for(let start=0;start<1000;start+=50) {
      const url=new URL("https://api.linkedin.com/rest/events");
      url.search=new URLSearchParams({q:"eventsByOrganizer",organizer:`urn:li:organization:${process.env.LINKEDIN_ORGANIZATION_ID}`,count:"50",start:String(start),excludeCancelled:"true",entryCriteria:"PUBLIC"}).toString();
      const response=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(10000),headers:{Authorization:`Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,"LinkedIn-Version":process.env.LINKEDIN_API_VERSION!,"X-Restli-Protocol-Version":"2.0.0"}});
      if(!response.ok)throw new Error("LinkedIn access unavailable");
      // LinkedIn long IDs exceed JavaScript's safe integer range.
      const raw=await response.text();
      const data=JSON.parse(raw.replace(/"id"\s*:\s*(\d+)/g,'"id":"$1"')) as {elements?:LinkedInEvent[];paging?:{links?:{rel:string}[]}};
      if(!Array.isArray(data.elements))throw new Error("LinkedIn response unavailable");
      events.push(...data.elements.map(event=>parseLinkedInEvent(event)).filter((event):event is Hackathon=>Boolean(event)));
      if(!data.paging?.links?.some(link=>link.rel==="next"))return {events,provider:{name:"LinkedIn",status:"ok",count:events.length}};
    }
    throw new Error("LinkedIn pagination incomplete");
  } catch { return {events:[],provider:{name:"LinkedIn",status:"unavailable",count:0,message:"LinkedIn sync failed. Check API approval, organization permissions, token expiry and API version. Manual entries remain available."}}; }
}
