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
import { Plus, Trash2, Upload, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  WAIT_TIME_OPTIONS,
  STATUS_LABEL,
  TYPE_LABEL,
  type ItemType,
  type ItemStatus,
} from "@/lib/park-constants";

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
};

export function ItemsManager({ parkId, type }: { parkId: string; type: ItemType }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
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
  }, [parkId, type]);

  const remove = async (id: string) => {
    if (!confirm("Wirklich löschen?")) return;
    const { error } = await supabase.from("park_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Gelöscht");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} {TYPE_LABEL[type]}
          {items.length === 1 ? "" : type === "attraction" ? "en" : type === "food" ? "" : ""}
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
            <div key={it.id} className="rounded-2xl border bg-background p-4 shadow-soft">
              <div className="flex items-start gap-3">
                {it.photo_url ? (
                  <img
                    src={it.photo_url}
                    alt={it.name}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-xl bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-semibold">{it.name}</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {STATUS_LABEL[it.status]}
                    {it.type === "attraction" && it.show_wait_time && it.wait_time
                      ? ` · ${it.wait_time} Min`
                      : ""}
                  </p>
                  {it.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {it.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <ItemDialog parkId={parkId} type={type} item={it} onSaved={load} trigger="icon" />
                  <Button size="icon" variant="ghost" onClick={() => remove(it.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
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
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [important, setImportant] = useState(item?.important_info ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(item?.photo_url ?? null);
  const [status, setStatus] = useState<ItemStatus>(item?.status ?? "sync");
  const [showWait, setShowWait] = useState(item?.show_wait_time ?? false);
  const [waitTime, setWaitTime] = useState(item?.wait_time ?? "5");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName(item?.name ?? "");
    setDescription(item?.description ?? "");
    setImportant(item?.important_info ?? "");
    setPhotoUrl(item?.photo_url ?? null);
    setStatus(item?.status ?? "sync");
    setShowWait(item?.show_wait_time ?? false);
    setWaitTime(item?.wait_time ?? "5");
  };

  const uploadPhoto = async (file: File) => {
    if (!user) return;
    setBusy(true);
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
    const payload = {
      park_id: parkId,
      type,
      name: name.trim(),
      description: description.trim() || null,
      important_info: important.trim() || null,
      photo_url: photoUrl,
      status,
      show_wait_time: type === "attraction" ? showWait : false,
      wait_time: type === "attraction" && showWait ? waitTime : null,
    };
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
            Pflege Name, Beschreibung, Foto und Status.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

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

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ItemStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sync">Mit Park-Öffnungszeiten synchron</SelectItem>
                <SelectItem value="open">Manuell geöffnet</SelectItem>
                <SelectItem value="closed">Manuell geschlossen</SelectItem>
              </SelectContent>
            </Select>
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
                          {w} {w === "90+" ? "Min" : "Min"}
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
