import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { getDemoPark, updateDemoPark } from "@/lib/demo-store";
import {
  type DayOverride,
  type HoursTemplate,
  type ParkHoursData,
  dateKey,
  dayStatus,
  getOverrides,
  getTemplates,
} from "@/lib/park-constants";

const MONTH_NAMES = [
  "Januar","Februar","März","April","Mai","Juni",
  "Juli","August","September","Oktober","November","Dezember",
];

export function OpeningHoursEditor({
  parkId,
  initial,
}: {
  parkId: string;
  initial: ParkHoursData;
}) {
  const [hours, setHours] = useState<ParkHoursData>(initial ?? {});
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [dayModalDate, setDayModalDate] = useState<Date | null>(null);

  const persist = async (next: ParkHoursData) => {
    setHours(next);
    if (getDemoPark(parkId)) {
      updateDemoPark(parkId, { opening_hours: next as never });
      return;
    }
    const { error } = await supabase
      .from("parks")
      .update({ opening_hours: next as never })
      .eq("id", parkId);
    if (error) toast.error(error.message);
  };

  const templates = getTemplates(hours);
  const overrides = getOverrides(hours);

  const upsertTemplate = (t: HoursTemplate) => {
    const next = { ...hours, _templates: [...templates.filter((x) => x.id !== t.id), t] };
    persist(next);
  };
  const removeTemplate = (id: string) => {
    const next = { ...hours, _templates: templates.filter((t) => t.id !== id) };
    persist(next);
  };
  const setOverride = (date: Date, ov: DayOverride) => {
    const k = dateKey(date);
    const nextOv = { ...overrides };
    if (ov.kind === "none") delete nextOv[k];
    else nextOv[k] = ov;
    persist({ ...hours, _overrides: nextOv });
  };

  // Build calendar grid
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-6">
      {/* Templates */}
      <div className="rounded-2xl border bg-background p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Öffnungszeiten-Vorlagen</h3>
          <NewTemplateDialog onSave={upsertTemplate} />
        </div>
        {templates.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Erstelle eine Vorlage (z.B. „Sommer 10–18"), um sie Tagen zuzuweisen.
          </p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center gap-2 rounded-xl border bg-card p-3">
                <div className="flex-1">
                  <p className="font-medium">{t.name || `${t.open}–${t.close}`}</p>
                  <p className="text-xs text-muted-foreground">{t.open} – {t.close}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeTemplate(t.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="rounded-2xl border bg-background p-4">
        <div className="flex items-center justify-between">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-semibold">{MONTH_NAMES[month]} {year}</h3>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {["Mo","Di","Mi","Do","Fr","Sa","So"].map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const status = dayStatus(hours, d);
            const isToday = dateKey(d) === dateKey(new Date());
            return (
              <button
                key={i}
                onClick={() => setDayModalDate(d)}
                className={`flex min-h-[64px] flex-col items-start rounded-lg border p-1.5 text-left text-xs transition hover:border-primary ${
                  isToday ? "border-primary" : ""
                }`}
              >
                <span className="font-semibold">{d.getDate()}</span>
                <span className="mt-auto flex items-center gap-1">
                  {status.kind === "open" && (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="truncate">{status.open}–{status.close}</span>
                    </>
                  )}
                  {status.kind === "closed" && (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      <span>Zu</span>
                    </>
                  )}
                  {status.kind === "none" && (
                    <span className="text-muted-foreground">—</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <DayModal
        date={dayModalDate}
        templates={templates}
        current={dayModalDate ? overrides[dateKey(dayModalDate)] : undefined}
        onClose={() => setDayModalDate(null)}
        onSelect={(ov) => {
          if (dayModalDate) setOverride(dayModalDate, ov);
          setDayModalDate(null);
        }}
      />
    </div>
  );
}

function NewTemplateDialog({ onSave }: { onSave: (t: HoursTemplate) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [from, setFrom] = useState("10:00");
  const [to, setTo] = useState("18:00");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> Vorlage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Öffnungszeiten-Vorlage</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name (optional)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sommer" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Von</Label>
              <Input type="time" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bis</Label>
              <Input type="time" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              onSave({
                id: crypto.randomUUID(),
                name: name.trim() || undefined,
                open: from,
                close: to,
              });
              setOpen(false);
              setName("");
            }}
          >
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DayModal({
  date,
  templates,
  current,
  onClose,
  onSelect,
}: {
  date: Date | null;
  templates: HoursTemplate[];
  current: DayOverride | undefined;
  onClose: () => void;
  onSelect: (ov: DayOverride) => void;
}) {
  const initial = current?.kind === "open" ? `tpl:${current.templateId}` : current?.kind ?? "none";
  const [value, setValue] = useState(initial);
  return (
    <Dialog open={!!date} onOpenChange={(v) => !v && onClose()}>
      <DialogContent key={date ? dateKey(date) : "none"}>
        <DialogHeader>
          <DialogTitle>
            {date?.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={value}
            onValueChange={(v) => {
              setValue(v);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Keine Angabe</SelectItem>
              <SelectItem value="closed">Geschlossen</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={`tpl:${t.id}`}>
                  Geöffnet: {t.name ? `${t.name} (${t.open}–${t.close})` : `${t.open}–${t.close}`}
                </SelectItem>
              ))}
              {templates.length === 0 && (
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  Erstelle zuerst eine Vorlage
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button
            onClick={() => {
              if (value === "none") onSelect({ kind: "none" });
              else if (value === "closed") onSelect({ kind: "closed" });
              else if (value.startsWith("tpl:")) onSelect({ kind: "open", templateId: value.slice(4) });
              else onClose();
            }}
          >
            Übernehmen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
