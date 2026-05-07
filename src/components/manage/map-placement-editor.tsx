import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { isDemoUser, loadDemoItems, updateDemoItemPosition } from "@/lib/demo-store";
import type { Item } from "@/components/manage/items-manager";
import { TYPE_LABEL } from "@/lib/park-constants";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MapPin, X } from "lucide-react";

const TYPE_COLORS: Record<Item["type"], string> = {
  attraction: "bg-primary text-primary-foreground",
  food: "bg-amber-500 text-white",
  other: "bg-slate-600 text-white",
};

export function MapPlacementEditor({
  parkId,
  mapUrl,
}: {
  parkId: string;
  mapUrl: string | null;
}) {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Item["type"] | "all">("all");
  const imgRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (isDemoUser(user)) {
      const all = [
        ...loadDemoItems(parkId, "attraction"),
        ...loadDemoItems(parkId, "food"),
        ...loadDemoItems(parkId, "other"),
      ];
      setItems(all);
      return;
    }
    const { data } = await supabase
      .from("park_items")
      .select("*")
      .eq("park_id", parkId)
      .order("created_at");
    setItems((data ?? []) as Item[]);
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, parkId]);

  const persistPosition = async (id: string, x: number | null, y: number | null) => {
    if (isDemoUser(user)) {
      updateDemoItemPosition(id, x, y);
      return;
    }
    const { error } = await supabase
      .from("park_items")
      .update({ map_x: x, map_y: y })
      .eq("id", id);
    if (error) toast.error(error.message);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedId || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    setItems((prev) =>
      prev.map((it) => (it.id === selectedId ? { ...it, map_x: x, map_y: y } : it))
    );
    persistPosition(selectedId, x, y);
    toast.success("Position gespeichert");
  };

  const removePin = (id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, map_x: null, map_y: null } : it)));
    persistPosition(id, null, null);
  };

  if (!mapUrl) {
    return (
      <p className="text-sm text-muted-foreground">
        Lade zuerst eine Parkkarte hoch, um Einträge zu platzieren.
      </p>
    );
  }

  const filtered = items.filter((it) => filter === "all" || it.type === filter);
  const unplaced = filtered.filter((it) => it.map_x == null);
  const placed = items.filter((it) => it.map_x != null);
  const selected = items.find((it) => it.id === selectedId) ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "attraction", "food", "other"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-full border px-3 py-1 text-xs ${
                filter === t ? "bg-primary text-primary-foreground" : "bg-card"
              }`}
            >
              {t === "all" ? "Alle" : TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <div
          ref={imgRef}
          onClick={handleMapClick}
          className={`relative overflow-hidden rounded-2xl border bg-muted ${
            selectedId ? "cursor-crosshair" : ""
          }`}
        >
          <img src={mapUrl} alt="Parkkarte" className="block w-full select-none" draggable={false} />
          {placed.map((it) => (
            <button
              key={it.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(it.id);
              }}
              className={`absolute -translate-x-1/2 -translate-y-full rounded-full p-1.5 shadow-elevated ring-2 ring-background ${
                TYPE_COLORS[it.type]
              } ${selectedId === it.id ? "scale-125" : ""}`}
              style={{ left: `${(it.map_x ?? 0) * 100}%`, top: `${(it.map_y ?? 0) * 100}%` }}
              title={it.name}
            >
              <MapPin className="h-4 w-4" />
            </button>
          ))}
        </div>
        {selected && (
          <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <MapPin className="h-4 w-4 text-primary" />
            <div className="flex-1 text-sm">
              <span className="font-semibold">{selected.name}</span>{" "}
              <span className="text-muted-foreground">
                {selected.map_x == null
                  ? "— klicke auf die Karte, um zu platzieren"
                  : "— klicke erneut, um zu verschieben"}
              </span>
            </div>
            {selected.map_x != null && (
              <Button size="sm" variant="ghost" onClick={() => removePin(selected.id)}>
                Entfernen
              </Button>
            )}
            <Button size="icon" variant="ghost" onClick={() => setSelectedId(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Noch nicht platziert ({unplaced.length})</h3>
          <div className="space-y-1">
            {unplaced.length === 0 ? (
              <p className="text-xs text-muted-foreground">Alles platziert 🎉</p>
            ) : (
              unplaced.map((it) => (
                <button
                  key={it.id}
                  onClick={() => setSelectedId(it.id)}
                  className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left text-sm ${
                    selectedId === it.id ? "border-primary bg-primary/5" : "bg-card"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${TYPE_COLORS[it.type]}`} />
                  <span className="flex-1 truncate">{it.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Platziert ({placed.length})</h3>
          <div className="space-y-1">
            {placed.map((it) => (
              <button
                key={it.id}
                onClick={() => setSelectedId(it.id)}
                className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left text-sm ${
                  selectedId === it.id ? "border-primary bg-primary/5" : "bg-card"
                }`}
              >
                <MapPin className={`h-3 w-3`} />
                <span className="flex-1 truncate">{it.name}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
