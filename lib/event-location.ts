// Match provider-supplied venues, not the organizer's mailing address.
export function normalizeCity(value: string | null | undefined): string {
  const city = (value ?? "").trim().replace(/\s+/g, " ");
  if (/\b(?:chennai|madras)\b/i.test(city)) return "Chennai";
  if (/\b(?:bengaluru|bangalore)\b/i.test(city)) return "Bengaluru";
  if (/\b(?:mumbai|bombay)\b/i.test(city)) return "Mumbai";
  if (/^(?:unknown|tbd|n\/a|not specified)$/i.test(city)) return "";
  return city;
}

export function matchesLocation(event: { mode: string; location: string | null }, selection: string) {
  if (selection === "all") return true;
  if (selection === "online") return event.mode === "Online" || event.mode === "Hybrid";
  if (selection === "unknown") return event.mode !== "Online" && !normalizeCity(event.location);
  return event.mode !== "Online" && normalizeCity(event.location).toLowerCase() === normalizeCity(selection).toLowerCase();
}
