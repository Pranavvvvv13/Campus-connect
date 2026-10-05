"use client";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, MapPin, RefreshCw, UsersRound } from "lucide-react";
import { workspaceRequest } from "@/lib/workspace-client";
import type { Profile, TeamMember, TeamRequest } from "@/lib/workspace-model";

type Directory = {members:TeamMember[];requests:TeamRequest[];accountId:string};
const tokens=(value:string)=>value.split(",").map(word=>word.trim().toLowerCase()).filter(Boolean);
export default function TeamFinder({query,onEditProfile}:{query:string;onEditProfile:()=>void}) {
  const [directory,setDirectory]=useState<Directory>({members:[],requests:[],accountId:""});
  const [profile,setProfile]=useState<Profile|null>(null);
  const [loading,setLoading]=useState(true);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState("");
  const refresh=useCallback(async(signal?:AbortSignal)=>{
    setLoading(true);
    try {const [data,own]=await Promise.all([workspaceRequest<Directory>("/api/teams",{signal}),workspaceRequest<{profile:Profile|null}>("/api/portfolio",{signal})]);setDirectory(data);setProfile(own.profile);setError("");}
    catch(error){if(!signal?.aborted)setError(error instanceof Error?error.message:"Could not load team finder.");}
    finally{if(!signal?.aborted)setLoading(false);}
  },[]);
  useEffect(()=>{const controller=new AbortController();const frame=requestAnimationFrame(()=>void refresh(controller.signal));return()=>{cancelAnimationFrame(frame);controller.abort();};},[refresh]);
  const act=async(method:string,body:unknown)=>{
    setPending(true);setError("");
    try {await workspaceRequest("/api/teams",{method,body:JSON.stringify(body)});await refresh();}
    catch(error){setError(error instanceof Error?error.message:"Could not update team request.");}
    finally{setPending(false);}
  };
  const ownSkills=tokens(profile?.skills??"");
  const ownInterests=tokens(profile?.interests??"");
  const matches=(member:TeamMember)=>[...new Set([...tokens(member.skills).filter(skill=>ownSkills.includes(skill)),...tokens(member.interests).filter(interest=>ownInterests.includes(interest)),...tokens(member.skills).filter(skill=>tokens(profile?.lookingFor??"").includes(skill))])];
  const members=directory.members.filter(member=>member.id!==directory.accountId&&[member.name,member.headline,member.skills,member.city,member.interests,member.lookingFor].join(" ").toLowerCase().includes(query.trim().toLowerCase())).sort((a,b)=>matches(b).length-matches(a).length||a.name.localeCompare(b.name));
  return <><div className="page-heading"><div><p className="eyebrow">Build better together</p><h1>Team finder</h1><p>Find opted-in campus members by skills, interests and city.</p></div><button className="secondary-button" disabled={loading||pending} onClick={()=>void refresh()}><RefreshCw size={15}/>Refresh</button></div>
    {error&&<p className="provider-notice" role="alert">{error}</p>}
    {!loading&&!profile?.teamVisible&&<div className="provider-notice"><UsersRound size={18}/><span>Your profile is private. Enable Team finder in your portfolio to receive and send team requests.</span><button className="secondary-button" onClick={onEditProfile}>Update my portfolio</button></div>}
    <p className="portfolio-local-note">Matches use shared skills and interests plus the skills you are looking for. Requests stay inside CampusConnect; no email is sent.</p>
    {loading&&<p role="status">Loading team profiles…</p>}
    <div className="card-grid team-grid">{members.map(member=>{const request=directory.requests.find(item=>(item.fromId===member.id&&item.toId===directory.accountId)||(item.toId===member.id&&item.fromId===directory.accountId));const shared=matches(member);return <article className="panel team-card" key={member.id}><span className="avatar">{member.name.split(" ").map(word=>word[0]).slice(0,2).join("")}</span><h2>{member.name}</h2><p>{member.headline}</p>{member.city&&<p className="event-location"><MapPin size={14}/>{member.city}</p>}<div className="skill-list">{tokens(member.skills).map(skill=><span key={skill}>{skill}</span>)}</div><p><strong>Interests</strong><br/>{member.interests||"Not listed"}</p><p><strong>Looking for</strong><br/>{member.lookingFor||"Open to collaborating"}</p>{shared.length>0&&<p className="team-match">{shared.length} matching {shared.length===1?"skill or interest":"skills / interests"}: {shared.join(", ")}</p>}<div className="portfolio-links">{member.github&&<a className="text-button" href={member.github} target="_blank" rel="noreferrer">GitHub<ArrowUpRight size={14}/></a>}{member.website&&<a className="text-button" href={member.website} target="_blank" rel="noreferrer">Website<ArrowUpRight size={14}/></a>}</div>{request?<span className="team-request-status">{request.status==="accepted"?"Connected":request.status==="declined"?"Request declined":request.toId===directory.accountId?"Incoming request · respond below":"Request sent"}</span>:<button className="secondary-button" disabled={pending||!profile?.teamVisible} onClick={()=>void act("POST",{toId:member.id})}>Request to team up</button>}</article>;})}</div>
    {!loading&&!members.length&&<div className="empty-clubs"><UsersRound size={24}/><strong>No available teammates match this view</strong><span>{query?"Try a different skill, interest or city.":"Campus members will appear here when they opt in through their portfolios."}</span></div>}
    <section className="panel team-requests"><h2>Team requests & connections</h2>{!directory.requests.length&&<p>No requests yet.</p>}{directory.requests.map(request=><div className="team-request" key={request.id}><div><strong>{request.fromId===directory.accountId?request.toName:request.fromName}</strong><p>{request.fromId===directory.accountId?"Outgoing":"Incoming"} · {request.status}</p></div>{request.status==="pending"&&request.toId===directory.accountId&&<div className="portfolio-editor-actions"><button className="primary-button" disabled={pending} onClick={()=>void act("PATCH",{id:request.id,status:"accepted"})}>Accept</button><button className="secondary-button" disabled={pending} onClick={()=>void act("PATCH",{id:request.id,status:"declined"})}>Decline</button></div>}{request.status==="accepted"&&<button className="text-button" disabled={pending} onClick={()=>void act("DELETE",{id:request.id})}>Disconnect</button>}{request.status==="pending"&&request.fromId===directory.accountId&&<button className="text-button" disabled={pending} onClick={()=>void act("DELETE",{id:request.id})}>Withdraw request</button>}</div>)}</section>
  </>;
}

