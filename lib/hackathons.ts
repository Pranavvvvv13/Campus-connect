export type Hackathon = {
  id: string;
  title: string;
  host: string;
  source: "Devfolio" | "Unstop";
  href: string;
  mode: "Online" | "Offline" | "Hybrid";
  location: string | null;
  startsAt: string | null;
  endsAt: string | null;
  deadline: string | null;
  tags: string[];
  imageUrl?: string | null;
  imageKind?: "banner" | "logo";
  description?: string;
  eligibility?: string;
  registrationOpensAt?: string | null;
};

export function registrationStatus(event: Hackathon, now: number) {
  const deadline = Date.parse(event.deadline ?? "");
  const end = Date.parse(event.endsAt ?? "");
  const opens = Date.parse(event.registrationOpensAt ?? "");
  if (deadline <= now || end <= now) return "Closed";
  if (opens > now) return "Opens soon";
  if (!Number.isFinite(deadline)) return "Check registration";
  return deadline - now <= 3 * 86400000 ? "Closing soon" : "Open";
}

export type HackathonFeed = {
  events: Hackathon[];
  fetchedAt: string;
  providers: { name: Hackathon["source"]; status: "ok" | "unavailable"; count: number }[];
};

export function eventDate(value: string | null) {
  if (!value) return "See event page";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "See event page" : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(date);
}
