export const WAIT_TIME_OPTIONS = [
  "1",
  "5",
  "10",
  "15",
  "20",
  "25",
  "30",
  "35",
  "40",
  "45",
  "50",
  "55",
  "60",
  "65",
  "70",
  "75",
  "80",
  "85",
  "90",
  "90+",
];

export type ItemType = "attraction" | "food" | "other";
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
