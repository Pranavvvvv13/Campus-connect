"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, MapPin, Trophy, Wifi } from "lucide-react";
import { eventDate, registrationStatus, type Hackathon } from "@/lib/hackathons";
import type { useBookmarks } from "@/hooks/use-bookmarks";
import { BookmarkActions } from "./hackathon-saving";

export default function HackathonCard({event,index,now,bookmarks,allowSaving}:{event:Hackathon;index:number;now:number;bookmarks:ReturnType<typeof useBookmarks>;allowSaving:boolean}) {
  const [failedUrl,setFailedUrl]=useState("");
  const [banner,setBanner]=useState<string|null>(null);
  const artworkRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(event.source!=="Unstop" || event.imageKind==="banner" || !/^unstop-\d+$/.test(event.id))return;
    const controller=new AbortController();
    const observer=new IntersectionObserver(entries=>{
      if(!entries.some(entry=>entry.isIntersecting))return;
      observer.disconnect();
      void fetch(`/api/hackathon-artwork?id=${event.id.slice(7)}`,{signal:controller.signal}).then(async response=>response.ok?await response.json() as {imageUrl:string|null}:null).then(data=>{if(!controller.signal.aborted&&data?.imageUrl)setBanner(data.imageUrl);}).catch(()=>{/* Keep a colourful logo cover when no original banner is available. */});
    },{rootMargin:"200px"});
    if(artworkRef.current)observer.observe(artworkRef.current);
    return()=>{observer.disconnect();controller.abort();};
  },[event.id,event.source,event.imageKind]);
  const imageUrl=banner&&banner!==failedUrl?banner:event.imageUrl;
  const isLogo=!(banner&&banner!==failedUrl)&&event.imageKind==="logo";
  const hasImage=Boolean(imageUrl && imageUrl!==failedUrl);
  const status=registrationStatus(event,now);
  const closed=status==="Closed";
  return <article className="event-card">
    <div ref={artworkRef} className={`event-art art-${index%4} ${hasImage?"provider-art":""} ${isLogo?"provider-logo colourful-cover":""}`}>
      {hasImage ? /* Provider images are already validated remote URLs; retain the native fallback on failure. */
        /* eslint-disable-next-line @next/next/no-img-element */
        <><img src={imageUrl!} alt={`${event.title} ${isLogo?"logo":"banner"}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailedUrl(imageUrl??"")}/>{isLogo&&<div className="cover-title"><small>{event.source} · {event.source==="LinkedIn"?"Event":"Hackathon"}</small><strong>{event.title}</strong></div>}</>
        : <><span>{event.source}</span><Trophy size={47} strokeWidth={1}/><small>{event.tags[0]??"Build. Learn. Connect."}</small></>}
    </div>
    <div className="event-body"><div className="event-top"><span className="source-badge">{event.source}{event.syncKind==="manual"?" · Manual entry":""}</span><span className="event-mode">{event.mode==="Online"?<Wifi size={12}/>:<MapPin size={12}/>} {event.mode}</span></div>
      <span className={`registration-status ${closed?"registration-closed":status==="Closing soon"?"registration-soon":""}`}>{status}</span>
      <h2>{event.title}</h2><p>{event.host}</p><p className="event-location"><MapPin size={13}/>{event.mode==="Online"?"Online · join anywhere":event.location||"Venue not listed · check event page"}</p>
      <div className="tag-row">{event.tags.slice(0,3).map(tag=><span key={tag}>{tag}</span>)}</div>
      <dl><div><dt>Starts</dt><dd>{eventDate(event.startsAt)}</dd></div><div><dt>Apply by</dt><dd>{eventDate(event.deadline)}</dd></div></dl>
      <details className="hackathon-details"><summary>Event details</summary><div><h3>About the event</h3><p>{event.description||"The provider has not supplied a description in this feed. Open the event page for the full brief."}</p><h3>Eligibility</h3><p>{event.eligibility||"Check the provider’s event page for eligibility, team size and application requirements."}</p><dl><div><dt>Registration opens</dt><dd>{eventDate(event.registrationOpensAt??null)}</dd></div><div><dt>Ends</dt><dd>{eventDate(event.endsAt)}</dd></div></dl><small>Status is based on the dates supplied by the provider. Confirm any changes on the event page.</small></div></details>
      <a className="secondary-button full" href={event.href} target="_blank" rel="noreferrer">{closed?"View event on":"Apply on"} {event.source}<ArrowUpRight size={16}/></a>
      {allowSaving&&<BookmarkActions event={event} bookmarks={bookmarks} now={now}/>}
    </div>
  </article>;
}
