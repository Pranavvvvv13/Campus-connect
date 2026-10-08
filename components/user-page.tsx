"use client";
import { useEffect, useState } from "react";
import { UserRound, Pencil, Check, X, Mail, IdCard } from "lucide-react";
import Portfolio from "./portfolio";
import { workspaceRequest } from "@/lib/workspace-client";
import type { DemoSession, Role } from "@/lib/demo-accounts";
export default function UserPage({viewer,role,onNameChange}:{viewer:{name:string;email:string};role:Role;onNameChange:(name:string)=>void}) {
  const [account,setAccount]=useState<DemoSession|null>(null);
  const [name,setName]=useState(viewer.name);
  const [editing,setEditing]=useState(false);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  useEffect(()=>{const controller=new AbortController();void workspaceRequest<{account:DemoSession}>("/api/user",{signal:controller.signal}).then(data=>{setAccount(data.account);setName(data.account.name);}).catch(error=>{if(!controller.signal.aborted)setError(error.message);});return()=>controller.abort();},[]);
  async function save(event:React.FormEvent){event.preventDefault();setSaving(true);setError("");setMessage("");try{const data=await workspaceRequest<{account:DemoSession}>("/api/user",{method:"PATCH",body:JSON.stringify({name})});setAccount(data.account);setName(data.account.name);onNameChange(data.account.name);setEditing(false);setMessage("Display name saved.");}catch(error){setError(error instanceof Error?error.message:"Could not save your name.");}finally{setSaving(false);}}
  return <div className="user-page"><div className="page-heading"><div><p className="eyebrow">Your campus identity</p><h1>User profile</h1><p>Your account details and portfolio, together.</p></div></div><section className="panel user-account-panel"><span className="user-account-avatar"><UserRound size={32}/></span><div className="user-account-content"><span className="user-role-label">{role} account</span>{editing?<form onSubmit={event=>void save(event)} className="user-name-form"><label>Display name<input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={event=>setName(event.target.value)} autoFocus/></label><div><button className="primary-button" disabled={saving}><Check size={15}/>{saving?"Saving…":"Save name"}</button><button className="secondary-button" disabled={saving} type="button" onClick={()=>{setEditing(false);setName(account?.name??viewer.name);setError("");}}><X size={15}/>Cancel</button></div></form>:<div className="user-name-heading"><h2>{viewer.name}</h2><button className="secondary-button" onClick={()=>{setEditing(true);setMessage("");}}><Pencil size={14}/>Edit name</button></div>}<div className="user-account-facts"><span><Mail size={15}/>{viewer.email}</span><span><IdCard size={15}/>{account?.universityId??"Loading university ID…"}</span></div><p className="user-account-help">Your display name is editable. Your verified university ID, email and role are managed by the university.</p>{error&&<p role="alert" className="provider-notice">{error}</p>}{message&&<p role="status">{message}</p>}</div></section><div className="user-portfolio-section"><Portfolio viewer={viewer} role={role}/></div></div>;
}
