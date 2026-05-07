import type { RuntimeState } from "@/lib/park-constants";

export type ItemMeta = {
  label?: string | null;
  runtime?: RuntimeState; // selected from card dropdown
};

type WithCustomHours = { custom_hours?: unknown };

export function getMeta(item: WithCustomHours | null | undefined): ItemMeta {
  const ch = (item?.custom_hours ?? {}) as Record<string, unknown>;
  const meta = (ch.meta ?? {}) as ItemMeta;
  return meta;
}

export function withMeta(current: unknown, patch: Partial<ItemMeta>) {
  const ch = (current ?? {}) as Record<string, unknown>;
  const meta = ((ch.meta ?? {}) as ItemMeta) || {};
  return { ...ch, meta: { ...meta, ...patch } };
}

const APP_DISABLED_KEY = "parkpilot_app_disabled";

export function isResortDisabled(resortId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(APP_DISABLED_KEY);
    if (!raw) return false;
    const set = JSON.parse(raw) as string[];
    return Array.isArray(set) && set.includes(resortId);
  } catch {
    return false;
  }
}

export function setResortDisabled(resortId: string, disabled: boolean) {
  if (typeof window === "undefined") return;
  let set: string[] = [];
  try {
    set = JSON.parse(localStorage.getItem(APP_DISABLED_KEY) ?? "[]");
    if (!Array.isArray(set)) set = [];
  } catch {
    set = [];
  }
  const next = disabled
    ? Array.from(new Set([...set, resortId]))
    : set.filter((id) => id !== resortId);
  localStorage.setItem(APP_DISABLED_KEY, JSON.stringify(next));
}
