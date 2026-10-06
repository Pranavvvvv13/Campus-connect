import type { Hackathon, HackathonFeed } from "./hackathons";

export function publicImage(value: unknown): string | null {
  if(typeof value!=="string")return null;
  try {const url=new URL(value);return url.protocol==="https:" && ["assets.devfolio.co","d8it4huxumps7.cloudfront.net"].includes(url.hostname)?url.href:null;}catch{return null;}
}
export function plainText(value:string) {
  return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,"").replace(/<[^>]*>/g," ").replace(/&(?:amp|quot|apos|lt|gt|nbsp);/g,entity=>({"&amp;":"&","&quot;":'"',"&apos;":"'","&lt;":"<","&gt;":">","&nbsp;":" "}[entity]??entity)).replace(/&#(\d+);/g,(_,number)=>{const code=Number(number);return code<=0x10ffff?String.fromCodePoint(code):"";}).replace(/\s+/g," ").trim();
}
export function pageMetadata(html:string) {
  const metas=[...html.matchAll(/<meta\b[^>]*>/gi)].map(match=>Object.fromEntries([...match[0].matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(item=>[item[1].toLowerCase(),item[2]])));
  return {imageUrl:publicImage(metas.find(meta=>meta.property==="og:image"||meta.name==="og:image")?.content),description:plainText(metas.find(meta=>meta.property==="og:description")?.content??metas.find(meta=>meta.name==="description")?.content??"").slice(0,2000)};
}
const artworkCache=new Map<string,{expires:number;value:ReturnType<typeof pageMetadata>}>();
const unstopBanners=new Map<string,{expires:number;imageUrl:string|null}>();
const pendingBanners=new Map<string,Promise<string|null>>();
export function parseUnstopBanner(raw:string):string|null {
  const event=JSON.parse(raw).data?.competition;
  return publicImage(event?.banner?.image_url) ?? publicImage(event?.banner_mobile?.image_url);
}
export async function loadUnstopBanner(id:string):Promise<string|null> {
  if(!/^\d{1,12}$/.test(id))throw new Error("Invalid Unstop event ID");
  const cached=unstopBanners.get(id);
  if(cached && cached.expires>Date.now())return cached.imageUrl;
  const pending=pendingBanners.get(id);if(pending)return pending;
  const result=readPublic(`https://unstop.com/api/public/competition/${id}`,5000).then(raw=>{
    const imageUrl=parseUnstopBanner(raw);
    if(unstopBanners.size>=500)unstopBanners.delete(unstopBanners.keys().next().value!);
    unstopBanners.set(id,{imageUrl,expires:Date.now()+1800000});return imageUrl;
  }).finally(()=>pendingBanners.delete(id));
  pendingBanners.set(id,result);return result;
}
async function enrichDevfolio(event:Hackathon):Promise<Hackathon> {
  const cached=artworkCache.get(event.id);
  if(cached && cached.expires>Date.now())return {...event,...cached.value,imageUrl:event.imageUrl??cached.value.imageUrl};
  try {
    const value=pageMetadata(await readPublic(event.href,3000));
    if(artworkCache.size>=300)artworkCache.delete(artworkCache.keys().next().value!);
    artworkCache.set(event.id,{expires:Date.now()+1800000,value});
    return {...event,...value,imageUrl:event.imageUrl??value.imageUrl};
  } catch {return event;}
}

type DevfolioEvent = {
  uuid: string; slug: string; name: string; starts_at?: string; ends_at?: string; is_online: boolean;
  themes?: { theme: { name: string } }[]; settings?: { reg_ends_at?: string; reg_starts_at?:string; featured_cover_img?:string; featured_cover_img_v2?:string };
};

async function readPublic(url: string, timeout=15000) {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(timeout), headers: { Accept: "application/json,text/html", "User-Agent": "CampusConnect/1.0 (public hackathon directory)" } });
  if (!response.ok) throw new Error(`Provider returned ${response.status}`);
  return response.text();
}

export function parseDevfolio(html: string, now = Date.now()): Hackathon[] {
  const raw = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!raw) throw new Error("Devfolio listing format unavailable");
  const data = JSON.parse(raw);
  const query = data.props?.pageProps?.dehydratedState?.queries?.find((item: { state?: { data?: { open_hackathons?: unknown } } }) => Array.isArray(item.state?.data?.open_hackathons));
  if (!query) throw new Error("Devfolio event data unavailable");
  const listings: DevfolioEvent[] = [...query.state.data.open_hackathons, ...(query.state.data.upcoming_hackathons ?? [])];
  return listings.filter(event => (!event.ends_at || Date.parse(event.ends_at) > now) && (!event.settings?.reg_ends_at || Date.parse(event.settings.reg_ends_at) > now)).map(event => ({
    id: `devfolio-${event.uuid}`, title: event.name, host: "Devfolio community", source: "Devfolio",
    href: `https://${event.slug}.devfolio.co/`, mode: event.is_online ? "Online" : "Offline", location: null,
    startsAt: event.starts_at ?? null, endsAt: event.ends_at ?? null, deadline: event.settings?.reg_ends_at ?? null,
    registrationOpensAt:event.settings?.reg_starts_at ?? null,
    imageUrl: publicImage(event.settings?.featured_cover_img_v2 ?? event.settings?.featured_cover_img), imageKind:"banner",
    tags: (event.themes ?? []).map(item => item.theme.name).filter(name => name !== "No Restrictions"),
  }));
}

export async function loadHackathons(): Promise<HackathonFeed> {
  const results = await Promise.allSettled([
    readPublic("https://devfolio.co/hackathons").then(async html => {
      const events = parseDevfolio(html);
      // Bound concurrent page requests; artwork failures must never discard an event.
      const enriched: Hackathon[] = [];
      for(let index=0;index<events.length;index+=6) enriched.push(...await Promise.all(events.slice(index,index+6).map(enrichDevfolio)));
      return enriched;
    }),
    loadUnstop(),
  ]);
  const names = ["Devfolio", "Unstop"] as const;
  results.forEach((result, index) => {
    if (result.status === "rejected") console.error(`${names[index]} feed failed:`, result.reason);
  });
  const events = results.flatMap(result => result.status === "fulfilled" ? result.value : []);
  const unique = [...new Map(events.map(event => [event.id, event])).values()];
  unique.sort((a, b) => (Date.parse(a.deadline ?? a.startsAt ?? "") || Infinity) - (Date.parse(b.deadline ?? b.startsAt ?? "") || Infinity));
  return { events: unique, fetchedAt: new Date().toISOString(), providers: results.map((result, index) => ({ name: names[index], status: result.status === "fulfilled" ? "ok" : "unavailable", count: result.status === "fulfilled" ? result.value.length : 0 })) };
}

type UnstopEvent = {
  id: number; title: string; type: string; public_url: string; region: string; regn_open: number;
  organisation?: { name?: string }; address_with_country_logo?: { city?: string }; start_date?: string; end_date?: string;
  regnRequirements?: { end_regn_dt?: string }; required_skills?: { skill_name?: string; skill?: string }[];
  logoUrl2?:string; thumb?:string; details?:string;
};

export function parseUnstop(raw: string, now = Date.now()): Hackathon[] {
  const response = JSON.parse(raw);
  const events: UnstopEvent[] = response.data?.data;
  if (!Array.isArray(events)) throw new Error("Unstop event data unavailable");
  return events.filter(event => event.type === "hackathons" && event.regn_open === 1 &&
    (!event.regnRequirements?.end_regn_dt || Date.parse(event.regnRequirements.end_regn_dt) > now) &&
    (!event.end_date || Date.parse(event.end_date) > now)
  ).map(event => ({
    id: `unstop-${event.id}`, title: event.title, host: event.organisation?.name ?? "Unstop community", source: "Unstop",
    href: new URL(event.public_url, "https://unstop.com/").href, mode: event.region === "online" ? "Online" : event.region === "hybrid" ? "Hybrid" : "Offline",
    location: event.address_with_country_logo?.city ?? null, startsAt: event.start_date ?? null, endsAt: event.end_date ?? null,
    deadline: event.regnRequirements?.end_regn_dt ?? null,
    imageUrl:publicImage(event.thumb) ?? publicImage(event.logoUrl2), imageKind:publicImage(event.thumb)?"banner":"logo",
    description:plainText(event.details ?? "").slice(0,2000),
    tags: [...new Set((event.required_skills ?? []).map(item => item.skill_name ?? item.skill ?? "").filter(Boolean))].slice(0, 3),
  }));
}

async function loadUnstop(): Promise<Hackathon[]> {
  const endpoint = "https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&oppstatus=open&per_page=50&page=";
  const first = await readPublic(endpoint + "1");
  const lastPage = Math.min(Number(JSON.parse(first).data?.last_page) || 1, 10);
  const remaining = await Promise.allSettled(Array.from({ length: lastPage - 1 }, (_, index) =>
    readPublic(endpoint + (index + 2)).then(raw => parseUnstop(raw))
  ));
  return [...parseUnstop(first), ...remaining.flatMap(result => result.status === "fulfilled" ? result.value : [])];
}
