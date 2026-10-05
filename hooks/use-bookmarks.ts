"use client";
import { useCallback, useEffect, useState } from "react";
import type { Hackathon } from "@/lib/hackathons";
import type { SavedHackathon } from "@/lib/workspace-model";
import { workspaceRequest } from "@/lib/workspace-client";

export function useBookmarks() {
  const [saved,setSaved] = useState<SavedHackathon[]>([]);
  const [ready,setReady] = useState(false);
  const [pending,setPending] = useState("");
  const [error,setError] = useState("");
  const refresh = useCallback(async (signal?:AbortSignal) => {
    try { const data = await workspaceRequest<{bookmarks:SavedHackathon[]}>("/api/bookmarks",{signal});setSaved(data.bookmarks);setReady(true);setError(""); }
    catch (error) { if (!signal?.aborted) setError(error instanceof Error ? error.message : "Could not load saved hackathons."); }
  },[]);
  useEffect(()=>{const controller=new AbortController();const frame=requestAnimationFrame(()=>void refresh(controller.signal));return()=>{cancelAnimationFrame(frame);controller.abort();};},[refresh]);
  const save = async (event:Hackathon,reminderDays:number) => {
    if (pending) return;
    setPending(event.id);setError("");
    try {await workspaceRequest("/api/bookmarks",{method:"PUT",body:JSON.stringify({event,reminderDays})});setSaved(current=>{const old=current.find(item=>item.event.id===event.id);return [{event,reminderDays,savedAt:old?.savedAt??new Date().toISOString()},...current.filter(item=>item.event.id!==event.id)];});}
    catch(error){setError(error instanceof Error?error.message:"Could not save hackathon.");}
    finally{setPending("");}
  };
  const remove = async (id:string) => {
    if (pending) return;
    setPending(id);setError("");
    try{await workspaceRequest("/api/bookmarks",{method:"DELETE",body:JSON.stringify({id})});setSaved(current=>current.filter(item=>item.event.id!==id));}
    catch(error){setError(error instanceof Error?error.message:"Could not remove bookmark.");}
    finally{setPending("");}
  };
  return {saved,ready,pending,error,refresh,save,remove};
}
