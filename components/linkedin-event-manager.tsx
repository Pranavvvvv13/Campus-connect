"use client";
import { useEffect, useState } from "react";
import { workspaceRequest } from "@/lib/workspace-client";
import type { Hackathon } from "@/lib/hackathons";
const empty={title:"",host:"",href:"",mode:"Online",location:"",startsAt:"",endsAt:"",description:"",imageUrl:""};
export default function LinkedInEventManager() {
  const [data,setData]=useState<{events:Hackathon[];configured:boolean}|null>(null);
  const [form,setForm]=useState(empty);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  async function refresh(){setData(await workspaceRequest("/api/linkedin-events"));}
  useEffect(()=>{const controller=new AbortController();void workspaceRequest<{events:Hackathon[];configured:boolean}>("/api/linkedin-events",{signal:controller.signal}).then(setData).catch(error=>{if(!controller.signal.aborted)setError(error.message);});return()=>controller.abort();},[]);
  async function save(event:React.FormEvent) {
    event.preventDefault();setBusy(true);setError("");setMessage("");
    try {await workspaceRequest("/api/linkedin-events",{method:"POST",body:JSON.stringify({...form,startsAt:new Date(form.startsAt).toISOString(),endsAt:new Date(form.endsAt).toISOString()})});setForm(empty);await refresh();setMessage("Event saved. It will appear in Hackathons & events after refresh. Manual entries do not sync from LinkedIn.");} catch(error){setError(error instanceof Error?error.message:"Could not save event.");}finally{setBusy(false);}
  }
  async function remove(id:string) {setBusy(true);setError("");try{await workspaceRequest("/api/linkedin-events",{method:"DELETE",body:JSON.stringify({id})});await refresh();}catch(error){setError(error instanceof Error?error.message:"Could not remove event.");}finally{setBusy(false);}}
  return <section className="panel admin-section"><h2>LinkedIn events</h2><p>{data?.configured?"Automatic sync is configured. Provider status in Hackathons & events confirms whether requests succeed.":"Automatic sync is not connected. Approved Events API access and server configuration are required."}</p><p>Add a LinkedIn event manually below. These details are maintained by admins, not refreshed from LinkedIn. Adding the same URL updates its existing entry.</p>
    {error&&<p role="alert" className="provider-notice">{error}</p>}{message&&<p role="status">{message}</p>}
    <form className="portfolio-editor" onSubmit={event=>void save(event)}><div className="linkedin-editor-grid">
      {([['title','Event title'],['host','Organizer'],['href','LinkedIn event URL'],['location','City / venue'],['imageUrl','LinkedIn banner URL (optional)']] as const).map(([key,label])=><label key={key}>{label}<input required={key!=="imageUrl"&&(key!=="location"||form.mode!=="Online")} type={key==="href"||key==="imageUrl"?"url":"text"} value={form[key]} onChange={event=>setForm({...form,[key]:event.target.value})} maxLength={key==="imageUrl"?2000:key==="href"?1000:200}/></label>)}
      <label>Mode<select value={form.mode} onChange={event=>setForm({...form,mode:event.target.value})}>{["Online","Offline","Hybrid"].map(mode=><option key={mode}>{mode}</option>)}</select></label>
      <label>Starts (your local time)<input required type="datetime-local" value={form.startsAt} onChange={event=>setForm({...form,startsAt:event.target.value})}/></label><label>Ends (your local time)<input required type="datetime-local" value={form.endsAt} onChange={event=>setForm({...form,endsAt:event.target.value})}/></label>
    </div><label>Description<textarea value={form.description} maxLength={2000} onChange={event=>setForm({...form,description:event.target.value})}/></label><button className="primary-button" disabled={busy}>{busy?"Saving…":"Save event"}</button></form>
    <div>{data?.events.map(event=><article key={event.id} className="admin-audit-item"><strong>{event.title}</strong><p>{event.location??event.mode} · Manually maintained</p><a href={event.href} target="_blank" rel="noreferrer">View on LinkedIn</a> <button className="text-button" disabled={busy} onClick={()=>void remove(event.id)}>Remove from feed</button></article>)}</div>
  </section>;
}
