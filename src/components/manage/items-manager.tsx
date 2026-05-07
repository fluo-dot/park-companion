import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Pencil, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { deleteDemoItem, fileToDataUrl, isDemoUser, loadDemoItems, saveDemoItem } from "@/lib/demo-store";
import {
  WAIT_TIME_OPTIONS,
  TYPE_LABEL,
  RUNTIME_STATES,
  type RuntimeState,
  type ItemType,
  type ItemStatus,
} from "@/lib/park-constants";
import { getMeta, withMeta } from "@/lib/item-meta";

export type Item = {
  id: string;
  park_id: string;
  type: ItemType;
  name: string;
  description: string | null;
  important_info: string | null;
  photo_url: string | null;
  status: ItemStatus;
  show_wait_time: boolean;
  wait_time: string | null;
  map_x: number | null;
  map_y: number | null;
  custom_hours?: Record<string, unknown> | null;
};

const OTHER_KINDS = [
  "Toilette",
  "Shop",
  "Erste Hilfe",
  "Eingang",
  "Ausgang",
  "Parkplatz",
  "Information",
  "Sonstiges",
];

const FOOD_KINDS = ["Restaurant", "Imbiss", "Eisdiele", "Café", "Bar", "Sonstiges"];

export function ItemsManager({ parkId, type }: { parkId: string; type: ItemType }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  const load = async () => {
    if (authLoading) return;
    if (isDemoUser(user)) {
      setItems(loadDemoItems(parkId, type));
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("park_items")
      .select("*")
      .eq("park_id", parkId)
      .eq("type", type)
      .order("created_at");
    setItems((data ?? []) as Item[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parkId, type, user, authLoading]);

  const remove = async (id: string) => {
    if (!confirm("Wirklich löschen?")) return;
    if (isDemoUser(user)) {
      deleteDemoItem(id);
      toast.success("Gelöscht");
      load();
      return;
    }
    const { error } = await supabase.from("park_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Gelöscht");
    load();
  };

  const updateItemQuick = async (item: Item, patch: Partial<Item>) => {
    const next = { ...item, ...patch };
    setItems((prev) => prev.map((i) => (i.id === item.id ? next : i)));
    if (isDemoUser(user)) {
      const { id, map_x, map_y, ...payload } = next;
      saveDemoItem(payload, id);
      return;
    }
    const { error } = await supabase
      .from("park_items")
      .update(patch as never)
      .eq("id", item.id);
    if (error) toast.error(error.message);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} {TYPE_LABEL[type]}
        </p>
        <ItemDialog parkId={parkId} type={type} onSaved={load} />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Lade…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          Noch keine Einträge.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((it) => (
            <ItemCard
              key={it.id}
              item={it}
              onChange={(patch) => updateItemQuick(it, patch)}
              onRemove={() => remove(it.id)}
              onSaved={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemCard({
  item,
  onChange,
  onRemove,
  onSaved,
}: {
  item: Item;
  onChange: (patch: Partial<Item>) => void;
  onRemove: () => void;
  onSaved: () => void;
}) {
  const meta = getMeta(item);
  const runtime: RuntimeState = (meta.runtime as RuntimeState) ?? "open";

  // Combined dropdown: wait time options if enabled, else runtime states
  const setRuntime = (v: RuntimeState) => {
    onChange({ custom_hours: withMeta(item.custom_hours, { runtime: v }) });
  };
  const setWait = (v: string) => onChange({ wait_time: v });

  return (
    <div className="rounded-2xl border bg-background p-4 shadow-soft">
      <div className="flex items-start gap-3">
        {item.photo_url ? (
          <img
            src={item.photo_url}
            alt={item.name}
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="h-16 w-16 shrink-0 rounded-xl bg-muted" />
        )}
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-semibold">{item.name}</h4>
          {meta.label && (
            <p className="truncate text-xs text-muted-foreground">{meta.label}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <ItemDialog
            parkId={item.park_id}
            type={item.type}
            item={item}
            onSaved={onSaved}
            trigger="icon"
          />
          <Button size="icon" variant="ghost" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {item.type === "attraction" ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Select value={runtime} onValueChange={(v) => setRuntime(v as RuntimeState)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RUNTIME_STATES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {item.show_wait_time && runtime === "open" && (
            <Select value={item.wait_time ?? "5"} onValueChange={setWait}>
              <SelectTrigger>
                <Clock className="mr-1 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WAIT_TIME_OPTIONS.map((w) => (
                  <SelectItem key={w} value={w}>
                    {w} Min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ) : (
        <div className="mt-3">
          <Select value={runtime} onValueChange={(v) => setRuntime(v as RuntimeState)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Geöffnet</SelectItem>
              <SelectItem value="closed">Geschlossen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function ItemDialog({
  parkId,
  type,
  item,
  onSaved,
  trigger = "button",
}: {
  parkId: string;
  type: ItemType;
  item?: Item;
  onSaved: () => void;
  trigger?: "button" | "icon";
}) {
  const { user } = useAuth();
  const initialMeta = getMeta(item);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [important, setImportant] = useState(item?.important_info ?? "");
  const [label, setLabel] = useState<string>(initialMeta.label ?? (type === "other" ? OTHER_KINDS[0] : type === "food" ? FOOD_KINDS[0] : ""));
  const [photoUrl, setPhotoUrl] = useState<string | null>(item?.photo_url ?? null);
  const [showWait, setShowWait] = useState(item?.show_wait_time ?? false);
  const [waitTime, setWaitTime] = useState(item?.wait_time ?? "5");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName(item?.name ?? "");
    setDescription(item?.description ?? "");
    setImportant(item?.important_info ?? "");
    setLabel(getMeta(item).label ?? (type === "other" ? OTHER_KINDS[0] : type === "food" ? FOOD_KINDS[0] : ""));
    setPhotoUrl(item?.photo_url ?? null);
    setShowWait(item?.show_wait_time ?? false);
    setWaitTime(item?.wait_time ?? "5");
  };

  const uploadPhoto = async (file: File) => {
    if (!user) return;
    setBusy(true);
    if (isDemoUser(user)) {
      setPhotoUrl(await fileToDataUrl(file));
      setBusy(false);
      return;
    }
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/items/${parkId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("park-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("park-assets").getPublicUrl(path);
    setPhotoUrl(data.publicUrl);
    setBusy(false);
  };

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const customHours = withMeta(item?.custom_hours, {
      label: label || null,
      runtime: getMeta(item).runtime ?? "open",
    });
    const payload = {
      park_id: parkId,
      type,
      name: name.trim(),
      description: description.trim() || null,
      important_info: important.trim() || null,
      photo_url: photoUrl,
      status: "sync" as ItemStatus,
      show_wait_time: type === "attraction" ? showWait : false,
      wait_time: type === "attraction" && showWait ? waitTime : null,
      custom_hours: customHours,
    };
    if (isDemoUser(user)) {
      saveDemoItem(payload, item?.id);
      setBusy(false);
      toast.success(item ? "Aktualisiert" : "Hinzugefügt");
      setOpen(false);
      reset();
      onSaved();
      return;
    }
    const { error } = item
      ? await supabase.from("park_items").update(payload).eq("id", item.id)
      : await supabase.from("park_items").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(item ? "Aktualisiert" : "Hinzugefügt");
    setOpen(false);
    reset();
    onSaved();
  };

  const kindOptions = type === "food" ? FOOD_KINDS : type === "other" ? OTHER_KINDS : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v && !item) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger === "icon" ? (
          <Button size="icon" variant="ghost">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {TYPE_LABEL[type]} hinzufügen
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? "Bearbeiten" : `Neue ${TYPE_LABEL[type]}`}
          </DialogTitle>
          <DialogDescription>
            Pflege Name, Beschreibung, Foto und Label.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {kindOptions ? (
            <div className="space-y-2">
              <Label>Art</Label>
              <Select value={label} onValueChange={setLabel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kindOptions.map((k) => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Label (optional)</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="z.B. Familienfahrgeschäft"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Foto</Label>
            <div className="flex items-center gap-3">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-muted" />
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadPhoto(f);
                }}
              />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Hochladen
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Wichtige Informationen</Label>
            <Textarea
              value={important}
              onChange={(e) => setImportant(e.target.value)}
              placeholder="z.B. Mindestgröße 1,20m"
            />
          </div>

          {type === "attraction" && (
            <div className="space-y-3 rounded-2xl border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <Label className="m-0">Wartezeit anzeigen</Label>
                <Switch checked={showWait} onCheckedChange={setShowWait} />
              </div>
              {showWait && (
                <div className="space-y-2">
                  <Label>Aktuelle Wartezeit</Label>
                  <Select value={waitTime} onValueChange={setWaitTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WAIT_TIME_OPTIONS.map((w) => (
                        <SelectItem key={w} value={w}>
                          {w} Min
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={busy || !name.trim()}>
            {busy ? "Speichere…" : item ? "Speichern" : "Hinzufügen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
