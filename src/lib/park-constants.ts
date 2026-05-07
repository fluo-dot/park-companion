export const WAIT_TIME_OPTIONS = [
  "1","5","10","15","20","25","30","35","40","45","50","55","60","65","70","75","80","85","90","90+",
];

export type ItemType = "attraction" | "food" | "other";
// Legacy DB enum — kept for backwards compat. We'll always store "sync" and put
// the rich runtime state into custom_hours.meta.
export type ItemStatus = "open" | "closed" | "sync" | "custom";

export const TYPE_LABEL: Record<ItemType, string> = {
  attraction: "Attraktion",
  food: "Gastronomie",
  other: "Sonstiges",
};

export const STATUS_LABEL: Record<ItemStatus, string> = {
  open: "Geöffnet",
  closed: "Geschlossen",
  sync: "Mit Park synchron",
  custom: "Eigene Zeiten",
};

// New: runtime states selectable from the item card dropdown
export type RuntimeState =
  | "open"
  | "closed"
  | "weather_closed"
  | "technical"
  | "maintenance";

export const RUNTIME_STATES: { value: RuntimeState; label: string; tone: "open" | "closed" }[] = [
  { value: "open", label: "Geöffnet", tone: "open" },
  { value: "closed", label: "Geschlossen", tone: "closed" },
  { value: "weather_closed", label: "Witterungsbedingt geschlossen", tone: "closed" },
  { value: "technical", label: "Technische Störung", tone: "closed" },
  { value: "maintenance", label: "Wartungsarbeiten", tone: "closed" },
];

export const RUNTIME_LABEL: Record<RuntimeState, string> = Object.fromEntries(
  RUNTIME_STATES.map((s) => [s.value, s.label])
) as Record<RuntimeState, string>;

// ---------- Opening hours (Templates + per-day overrides) ----------
export type HoursTemplate = { id: string; name?: string; open: string; close: string };
export type DayOverride =
  | { kind: "open"; templateId: string }
  | { kind: "closed" }
  | { kind: "none" };

export type ParkHoursData = {
  // legacy weekly schedule kept untouched in same jsonb
  _templates?: HoursTemplate[];
  _overrides?: Record<string, DayOverride>;
} & Record<string, unknown>;

export function getTemplates(hours: ParkHoursData | null | undefined): HoursTemplate[] {
  return hours?._templates ?? [];
}
export function getOverrides(hours: ParkHoursData | null | undefined): Record<string, DayOverride> {
  return hours?._overrides ?? {};
}
export function dateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
export function dayStatus(
  hours: ParkHoursData | null | undefined,
  date: Date,
): { kind: "open" | "closed" | "none"; open?: string; close?: string } {
  const o = getOverrides(hours)[dateKey(date)];
  if (!o || o.kind === "none") return { kind: "none" };
  if (o.kind === "closed") return { kind: "closed" };
  const t = getTemplates(hours).find((t) => t.id === o.templateId);
  if (!t) return { kind: "none" };
  return { kind: "open", open: t.open, close: t.close };
}
/** Is the park currently open right now? Returns { state, today } */
export function nowState(hours: ParkHoursData | null | undefined, now = new Date()) {
  const today = dayStatus(hours, now);
  if (today.kind !== "open") return { isOpen: false, today };
  const [oh, om] = today.open!.split(":").map(Number);
  const [ch, cm] = today.close!.split(":").map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  const open = oh * 60 + om;
  const close = ch * 60 + cm;
  return { isOpen: cur >= open && cur < close, today };
}
