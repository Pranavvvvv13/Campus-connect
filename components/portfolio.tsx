"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Award, LockKeyhole, Plus, Trash2 } from "lucide-react";
import { profileSchema, type Profile } from "@/lib/workspace-model";
import { workspaceRequest } from "@/lib/workspace-client";

type Entry = { title: string; description: string; url: string };
const emptyEntry = (): Entry => ({ title: "", description: "", url: "" });
const safeUrl = (value: string) => { try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : ""; } catch { return ""; } };

export default function Portfolio({ viewer, role }: { viewer: { name: string; email: string }; role: string }) {
  const initial: Profile = {
    headline: role === "Faculty" ? "Faculty · Computer Science & Engineering" : role === "Admin" ? "Campus administration" : "B.Tech Computer Science · Class of 2028",
    about: "", skills: "", github: "", linkedin: "", website: "", projects: [], achievements: [], teamVisible:false, city:"", interests:"", lookingFor:"", facultyVisible:false, department:"Computer Science & Engineering", year:2,
  };
  const [profile, setProfile] = useState<Profile>(initial);
  const [draft, setDraft] = useState<Profile>(initial);
  const [editing, setEditing] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const storageKey = `campus-portfolio:v1:${viewer.email.toLowerCase()}`;
  useEffect(() => {
    const controller = new AbortController();
    void workspaceRequest<{profile:Profile|null}>("/api/portfolio", {signal:controller.signal}).then(data => {
      if (data.profile) setProfile(profileSchema.parse(data.profile));
      else {
        try { const raw = localStorage.getItem(storageKey); if (raw) { const previous = profileSchema.safeParse(JSON.parse(raw)); if (previous.success) {setProfile(previous.data);setMessage("Your previous browser portfolio is loaded. Save it to move it to the database.");} } } catch { /* A browser draft is optional; the database remains authoritative. */ }
      }
      setReady(true);
    }).catch(error => { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Could not load your portfolio."); });
    return () => controller.abort();
  }, [storageKey,retry]);
  const edit = () => { setDraft(structuredClone(profile)); setEditing(true); setMessage(""); };
  const change = (key: keyof Profile, value: string) => setDraft(current => ({ ...current, [key]: value }));
  const changeEntry = (kind: "projects" | "achievements", index: number, key: keyof Entry, value: string) => setDraft(current => ({ ...current, [kind]: current[kind].map((entry, i) => i === index ? { ...entry, [key]: value } : entry) }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const urls = [draft.github, draft.linkedin, draft.website, ...draft.projects.map(entry => entry.url), ...draft.achievements.map(entry => entry.url)];
    if (urls.some(value => value.trim() && !safeUrl(value.trim()))) { setMessage("Use a complete http:// or https:// URL for every link."); return; }
    const cleanEntries = (entries: Entry[]) => entries.map(entry => ({ title: entry.title.trim(), description: entry.description.trim(), url: entry.url.trim() }));
    const next = { ...draft, headline: draft.headline.trim(), about: draft.about.trim(), skills: [...new Set(draft.skills.split(",").map(skill => skill.trim()).filter(Boolean))].join(", "), github: draft.github.trim(), linkedin: draft.linkedin.trim(), website: draft.website.trim(), projects: cleanEntries(draft.projects), achievements: cleanEntries(draft.achievements) };
    setSaving(true);
    try { const data = await workspaceRequest<{profile:Profile}>("/api/portfolio",{method:"PUT",body:JSON.stringify(next)}); setProfile(data.profile); setEditing(false); setMessage("Portfolio saved to your account database."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not save. Your edits are still here; please retry."); }
    finally { setSaving(false); }
  };
  return <>
    <div className="page-heading"><div><p className="eyebrow">Your professional identity</p><h1>My portfolio</h1><p>Share your interests, projects and achievements.</p></div>{!editing && <button className="primary-button" disabled={!ready} onClick={edit}>Edit portfolio</button>}</div>
    <p className="portfolio-local-note">Your portfolio is saved to your account in the workspace database.</p>
    {!ready && <p className="provider-notice" role="status">Loading your saved portfolio… <button className="text-button" onClick={()=>setRetry(current=>current+1)}>Retry</button></p>}
    {message && <p className="provider-notice" role="status">{message}</p>}
    {editing ? <form className="panel portfolio-editor" onSubmit={event=>void save(event)}>
      <h2>Edit portfolio</h2><p className="portfolio-local-note">Your account name and university email stay tied to your sign-in.</p>
      <label>Headline<input required maxLength={160} value={draft.headline} onChange={e => change("headline", e.target.value)} /></label>
      {role === "Student" && <fieldset><legend>Faculty portfolio directory</legend><label>Department<input required maxLength={100} value={draft.department} onChange={e=>change("department",e.target.value)}/></label><label>Year<select value={draft.year} onChange={e=>setDraft(current=>({...current,year:Number(e.target.value)}))}>{[1,2,3,4].map(year=><option key={year} value={year}>Year {year}</option>)}</select></label><label><input type="checkbox" checked={draft.facultyVisible} onChange={e=>setDraft(current=>({...current,facultyVisible:e.target.checked}))}/> Share my portfolio with faculty</label><p>Your introduction, skills, projects, achievements and professional links will be visible to signed-in faculty and administrators. Your email and account settings stay private.</p></fieldset>}
      <label>About<textarea rows={4} maxLength={2000} value={draft.about} onChange={e => change("about", e.target.value)} placeholder="Tell people what you enjoy building and learning." /></label>
      <label>Skills<input maxLength={500} value={draft.skills} onChange={e => change("skills", e.target.value)} placeholder="Python, React, Machine Learning" /><small>Separate skills with commas.</small></label>
      <div className="portfolio-link-fields">{([['github', 'GitHub'], ['linkedin', 'LinkedIn'], ['website', 'Personal website']] as const).map(([key, label]) => <label key={key}>{label}<input type="url" maxLength={500} value={draft[key]} onChange={e => change(key, e.target.value)} placeholder="https://…" /></label>)}</div>
      {(["projects", "achievements"] as const).map(kind => <fieldset key={kind}><legend>{kind === "projects" ? "Projects" : "Achievements"}</legend>{draft[kind].map((entry, index) => <div className="portfolio-entry-editor" key={index}><div className="panel-title"><strong>{kind === "projects" ? "Project" : "Achievement"} {index + 1}</strong><button type="button" className="text-button" aria-label={`Remove ${kind === "projects" ? "project" : "achievement"} ${index + 1}`} onClick={() => setDraft(current => ({ ...current, [kind]: current[kind].filter((_, i) => i !== index) }))}><Trash2 size={15} />Remove</button></div><label>Title<input required maxLength={160} value={entry.title} onChange={e => changeEntry(kind, index, "title", e.target.value)} /></label><label>Description<textarea rows={2} maxLength={1000} value={entry.description} onChange={e => changeEntry(kind, index, "description", e.target.value)} /></label><label>{kind === "projects" ? "Project link" : "Certificate or evidence link"}<input type="url" maxLength={500} value={entry.url} onChange={e => changeEntry(kind, index, "url", e.target.value)} placeholder="https://…" /></label></div>)}<button type="button" className="secondary-button" onClick={() => setDraft(current => ({ ...current, [kind]: [...current[kind], emptyEntry()] }))}><Plus size={15} />Add {kind === "projects" ? "project" : "achievement"}</button></fieldset>)}
      <div className="portfolio-editor-actions"><button type="submit" disabled={saving} className="primary-button">{saving ? "Saving…" : "Save changes"}</button><button type="button" disabled={saving} className="secondary-button" onClick={() => { setEditing(false); setMessage(""); }}>Cancel</button></div>
    </form> : <>
      <section className="profile-hero"><div className="profile-cover" /><div className="profile-main"><span className="profile-avatar">{viewer.name.split(" ").map(part => part[0]).slice(0, 2).join("")}</span><div className="profile-identity"><h2>{viewer.name}</h2><p>{profile.headline}</p><small>{viewer.email}</small></div><div className="visibility"><LockKeyhole size={16} /><span><strong>{profile.facultyVisible ? "Shared with faculty" : "Private portfolio"}</strong><small>Saved to your account</small></span></div></div></section>
      <div className="profile-grid"><section className="panel profile-section"><div className="panel-title"><h2>About</h2><button disabled={!ready} onClick={edit}>Edit</button></div><p className="portfolio-text">{profile.about || "Add a short introduction to your portfolio."}</p><div className="skill-list">{profile.skills.split(",").map(skill => skill.trim()).filter(Boolean).map(skill => <span key={skill}>{skill}</span>)}</div></section>
      <section className="panel profile-section"><div className="panel-title"><h2>Links</h2></div><div className="portfolio-links">{([['github', 'GitHub'], ['linkedin', 'LinkedIn'], ['website', 'Personal website']] as const).map(([key, label]) => safeUrl(profile[key]) && <a key={key} className="secondary-button" href={safeUrl(profile[key])} target="_blank" rel="noreferrer">{label}<ArrowUpRight size={15} /></a>)}{!profile.github && !profile.linkedin && !profile.website && <p>Add your GitHub, LinkedIn or website.</p>}</div></section>
      {(["projects", "achievements"] as const).map(kind => <section key={kind} className="panel profile-section wide"><div className="panel-title"><h2>{kind === "projects" ? "Projects" : "Achievements"}</h2><button disabled={!ready} onClick={edit}>Add {kind === "projects" ? "project" : "achievement"}</button></div>{!profile[kind].length && <p>{kind === "projects" ? "Showcase something you have built." : "Add awards, certifications or milestones."}</p>}{profile[kind].map((entry, index) => <div className="achievement" key={index}><span><Award size={19} /></span><div><strong>{entry.title}</strong><p className="portfolio-text">{entry.description}</p>{safeUrl(entry.url) && <a className="text-button" href={safeUrl(entry.url)} target="_blank" rel="noreferrer">{kind === "projects" ? "View project" : "View evidence"}<ArrowUpRight size={14} /></a>}</div>{kind === "achievements" && <small>Self-reported</small>}</div>)}</section>)}
      </div>
    </>}
  </>;
}

