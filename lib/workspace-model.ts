import { z } from "zod";
import type { Hackathon } from "./hackathons";

const webLink = z.string().trim().max(500).refine(value => {
  if (!value) return true;
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
}, "Use a complete http:// or https:// link.");
const entry = z.object({ title: z.string().trim().min(1).max(160), description: z.string().trim().max(1000), url: webLink });
export const profileSchema = z.object({
  headline: z.string().trim().min(1).max(160), about: z.string().trim().max(2000), skills: z.string().trim().max(500),
  github: webLink, linkedin: webLink, website: webLink, projects: z.array(entry).max(20), achievements: z.array(entry).max(20),
  teamVisible: z.boolean().default(false), city: z.string().trim().max(100).default(""),
  interests: z.string().trim().max(500).default(""), lookingFor: z.string().trim().max(500).default(""),
});
export type Profile = z.infer<typeof profileSchema>;
export const eventSchema = z.object({
  id: z.string().max(100), title: z.string().min(1).max(500), host: z.string().max(500), source: z.enum(["Devfolio", "Unstop"]),
  href: z.string().url().max(1000).transform(value=>new URL(value).href), mode: z.enum(["Online", "Offline", "Hybrid"]), location: z.string().max(200).nullable(),
  startsAt: z.string().max(100).nullable(), endsAt: z.string().max(100).nullable(), deadline: z.string().max(100).nullable(), tags: z.array(z.string().max(200)).max(30),
}).refine(event => {
  const url = new URL(event.href);
  return url.protocol === "https:" && (event.source === "Devfolio" ? url.hostname.endsWith(".devfolio.co") : url.hostname === "unstop.com");
}, "Event link must belong to its provider.");
export type SavedHackathon = { event: Hackathon; reminderDays: number; savedAt: string };
export type TeamMember = { id: string; name: string; role: string; headline: string; skills: string; city: string; interests: string; lookingFor: string; github: string; website: string };
export type TeamRequest = { id: string; fromId: string; toId: string; fromName: string; toName: string; status: "pending" | "accepted" | "declined"; createdAt: string };
export function sortHackathons(events: Hackathon[], sort: string) {
  const timestamp = (value: string | null) => { const parsed = value ? Date.parse(value) : NaN; return Number.isFinite(parsed) ? parsed : Infinity; };
  return [...events].sort((a, b) => (sort === "title" ? a.title.localeCompare(b.title) : timestamp(sort === "start" ? a.startsAt : a.deadline) - timestamp(sort === "start" ? b.startsAt : b.deadline)) || a.title.localeCompare(b.title));
}
export function dueReminders(saved: SavedHackathon[], now = Date.now()) {
  return saved.filter(item => { const deadline = Date.parse(item.event.deadline ?? ""); return item.reminderDays > 0 && deadline > now && deadline - now <= item.reminderDays * 86400000; });
}
export function calendarReminder(event: Hackathon, reminderDays: number) {
  const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const deadline = Date.parse(event.deadline ?? "");
  if (!Number.isFinite(deadline)) throw new Error("No registration deadline is available for this event.");
  const date = new Date(deadline).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CampusConnect//Deadline Reminder//EN", "BEGIN:VEVENT", `UID:${escape(event.id)}-deadline@campusconnect.local`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`, `DTSTART:${date}`, `SUMMARY:${escape("Apply by: " + event.title)}`, `DESCRIPTION:${escape("Registration deadline. Check the provider for any changes. " + event.href)}`, `URL:${event.href}`];
  if (reminderDays > 0) lines.push("BEGIN:VALARM", `TRIGGER:-P${reminderDays}D`, "ACTION:DISPLAY", `DESCRIPTION:${escape("Register for " + event.title)}`, "END:VALARM");
  lines.push("END:VEVENT", "END:VCALENDAR");
  // Fold by UTF-8 byte length as required by the calendar format.
  return lines.flatMap(line => { const parts: string[] = []; let part = ""; let bytes = 0; for (const char of line) { const size = new TextEncoder().encode(char).length; if (bytes + size > 73) { parts.push(part); part = " "; bytes = 1; } part += char; bytes += size; } parts.push(part); return parts; }).join("\r\n") + "\r\n";
}
