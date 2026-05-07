import type { Item } from "@/components/manage/items-manager";

const DEMO_USER_KEY = "parkpilot_demo_user";
const DEMO_DATA_KEY = "parkpilot_demo_data";

export type DemoUser = {
  id: string;
  email?: string;
  isDemo: true;
  user_metadata?: { display_name?: string };
};

export type DemoHours = Record<string, { open: string; close: string; closed: boolean }>;

export type DemoResort = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
};

export type DemoPark = {
  id: string;
  resort_id: string;
  name: string;
  description: string | null;
  map_image_url: string | null;
  opening_hours: DemoHours;
  created_at: string;
};

export type DemoLink = {
  id: string;
  resort_id: string;
  title: string;
  url: string;
  image_url: string | null;
  sort_order: number;
  created_at: string;
};

type DemoData = {
  resorts: DemoResort[];
  parks: DemoPark[];
  items: Item[];
  links: DemoLink[];
};

export const defaultOpeningHours: DemoHours = {
  mon: { open: "10:00", close: "18:00", closed: false },
  tue: { open: "10:00", close: "18:00", closed: false },
  wed: { open: "10:00", close: "18:00", closed: false },
  thu: { open: "10:00", close: "18:00", closed: false },
  fri: { open: "10:00", close: "18:00", closed: false },
  sat: { open: "10:00", close: "19:00", closed: false },
  sun: { open: "10:00", close: "19:00", closed: false },
};

const emptyData = (): DemoData => ({ resorts: [], parks: [], items: [], links: [] });

const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;

const newId = (prefix: string) => {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  return `${prefix}_${random}`;
};

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export function getDemoUser(): DemoUser | null {
  if (!canUseStorage()) return null;
  return safeParse<DemoUser | null>(localStorage.getItem(DEMO_USER_KEY), null);
}

export function createDemoUser(email: string, displayName?: string): DemoUser {
  const user: DemoUser = {
    id: `demo_${email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_") || "user"}`,
    email,
    isDemo: true,
    user_metadata: { display_name: displayName || email.split("@")[0] },
  };
  if (canUseStorage()) localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  return user;
}

export function clearDemoUser() {
  if (canUseStorage()) localStorage.removeItem(DEMO_USER_KEY);
}

export function isDemoUser(user: unknown): user is DemoUser {
  return !!user && typeof user === "object" && "isDemo" in user;
}

function readData(): DemoData {
  if (!canUseStorage()) return emptyData();
  return safeParse<DemoData>(localStorage.getItem(DEMO_DATA_KEY), emptyData());
}

function writeData(data: DemoData) {
  if (canUseStorage()) localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(data));
}

export function loadDemoDashboard(ownerId: string) {
  const data = readData();
  const resorts = data.resorts
    .filter((resort) => resort.owner_id === ownerId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const resortIds = new Set(resorts.map((resort) => resort.id));
  const parks = data.parks
    .filter((park) => resortIds.has(park.resort_id))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  return { resorts, parks };
}

export function createDemoResort(input: {
  ownerId: string;
  name: string;
  description: string | null;
  slug: string;
}) {
  const data = readData();
  data.resorts.push({
    id: newId("resort"),
    owner_id: input.ownerId,
    name: input.name,
    description: input.description,
    slug: input.slug,
    created_at: new Date().toISOString(),
  });
  writeData(data);
}

export function createDemoPark(input: {
  resortId: string;
  name: string;
  description: string | null;
  openingHours?: DemoHours;
}) {
  const data = readData();
  data.parks.push({
    id: newId("park"),
    resort_id: input.resortId,
    name: input.name,
    description: input.description,
    map_image_url: null,
    opening_hours: input.openingHours ?? defaultOpeningHours,
    created_at: new Date().toISOString(),
  });
  writeData(data);
}

export function getDemoPark(parkId: string) {
  return readData().parks.find((park) => park.id === parkId) ?? null;
}

export function getDemoResortName(resortId: string) {
  return readData().resorts.find((resort) => resort.id === resortId)?.name ?? "";
}

export function updateDemoPark(parkId: string, patch: Partial<Pick<DemoPark, "map_image_url" | "opening_hours">>) {
  const data = readData();
  data.parks = data.parks.map((park) => (park.id === parkId ? { ...park, ...patch } : park));
  writeData(data);
}

export function loadDemoItems(parkId: string, type?: Item["type"]) {
  return readData().items.filter((item) => item.park_id === parkId && (!type || item.type === type));
}

export function saveDemoItem(payload: Omit<Item, "id" | "map_x" | "map_y">, itemId?: string) {
  const data = readData();
  if (itemId) {
    data.items = data.items.map((item) => (item.id === itemId ? { ...item, ...payload } : item));
  } else {
    data.items.push({ ...payload, id: newId("item"), map_x: null, map_y: null });
  }
  writeData(data);
}

export function updateDemoItemPosition(itemId: string, map_x: number | null, map_y: number | null) {
  const data = readData();
  data.items = data.items.map((item) => (item.id === itemId ? { ...item, map_x, map_y } : item));
  writeData(data);
}

export function deleteDemoItem(itemId: string) {
  const data = readData();
  data.items = data.items.filter((item) => item.id !== itemId);
  writeData(data);
}

export function loadDemoLinks(resortId: string) {
  return readData().links
    .filter((link) => link.resort_id === resortId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function createDemoLink(input: { resortId: string; title: string; url: string }) {
  const data = readData();
  data.links.push({
    id: newId("link"),
    resort_id: input.resortId,
    title: input.title,
    url: input.url,
    image_url: null,
    sort_order: data.links.filter((link) => link.resort_id === input.resortId).length,
    created_at: new Date().toISOString(),
  });
  writeData(data);
}

export function deleteDemoLink(linkId: string) {
  const data = readData();
  data.links = data.links.filter((link) => link.id !== linkId);
  writeData(data);
}

export function loadDemoVisitorApp(resortSlug: string) {
  const data = readData();
  const resort = data.resorts.find((entry) => entry.slug === resortSlug);
  if (!resort) return null;
  const parks = data.parks.filter((park) => park.resort_id === resort.id);
  const parkIds = new Set(parks.map((park) => park.id));
  return {
    resort,
    parks,
    items: data.items.filter((item) => parkIds.has(item.park_id)),
    links: data.links.filter((link) => link.resort_id === resort.id),
  };
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden"));
    reader.readAsDataURL(file);
  });
}