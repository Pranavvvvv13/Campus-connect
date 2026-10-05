"use client";
import { Bell, Bookmark, CalendarDays } from "lucide-react";
import type { Hackathon } from "@/lib/hackathons";
import { calendarReminder, dueReminders, type SavedHackathon } from "@/lib/workspace-model";
import type { useBookmarks } from "@/hooks/use-bookmarks";

export function BookmarkActions({event,bookmarks,now}:{event:Hackathon;bookmarks:ReturnType<typeof useBookmarks>;now:number}) {
  const saved=bookmarks.saved.find(item=>item.event.id===event.id);
  const futureDeadline=Date.parse(event.deadline??"")>now;
  const calendar = () => {
    const url=URL.createObjectURL(new Blob([calendarReminder(event,saved?.reminderDays??1)],{type:"text/calendar;charset=utf-8"}));
    const link=document.createElement("a");link.href=url;link.download=`${event.id}-deadline.ics`;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <div className="bookmark-actions"><button className={saved?"secondary-button saved-button":"secondary-button"} aria-pressed={Boolean(saved)} disabled={!bookmarks.ready||Boolean(bookmarks.pending)} onClick={()=>void (saved?bookmarks.remove(event.id):bookmarks.save(event,1))}><Bookmark size={15} fill={saved?"currentColor":"none"}/>{saved?"Saved · remove":"Save hackathon"}</button>{saved&&<><label className="reminder-select"><Bell size={14}/><span>Remind me</span><select aria-label={`Reminder for ${event.title}`} disabled={Boolean(bookmarks.pending)||!futureDeadline} value={saved.reminderDays} onChange={e=>void bookmarks.save(event,Number(e.target.value))}><option value={0}>Off</option><option value={1}>1 day before</option><option value={3}>3 days before</option><option value={7}>1 week before</option></select></label>{futureDeadline?<button className="text-button" onClick={calendar}><CalendarDays size={14}/>Add deadline to calendar</button>:<small>{event.deadline?"Registration deadline has passed.":"Provider has not listed a deadline."}</small>}</>}</div>;
}
export function DeadlineReminders({saved,now,onOpen}:{saved:SavedHackathon[];now:number;onOpen:()=>void}) {
  const due=dueReminders(saved,now);
  if (!due.length) return null;
  return <section className="deadline-reminders" aria-label="Saved hackathon deadline reminders"><div><Bell size={17}/><strong>{due.length} saved {due.length===1?"deadline":"deadlines"} approaching</strong><button className="text-button" onClick={onOpen}>View saved hackathons</button></div>{due.slice(0,3).map(item=>{const hours=Math.ceil((Date.parse(item.event.deadline!)-now)/3600000);return <a key={item.event.id} href={item.event.href} target="_blank" rel="noreferrer">{item.event.title}<span>{hours} {hours===1?"hour":"hours"} left to register</span></a>;})}<small>In-app reminders update while this workspace is open. Import a calendar reminder for alerts outside the app.</small></section>;
}
