import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { getDemoPark, updateDemoPark } from "@/lib/demo-store";

type Hours = Record<string, { open: string; close: string; closed: boolean }>;

const DAYS: { key: string; label: string }[] = [
  { key: "mon", label: "Montag" },
  { key: "tue", label: "Dienstag" },
  { key: "wed", label: "Mittwoch" },
  { key: "thu", label: "Donnerstag" },
  { key: "fri", label: "Freitag" },
  { key: "sat", label: "Samstag" },
  { key: "sun", label: "Sonntag" },
];

export function OpeningHoursEditor({
  parkId,
  initial,
}: {
  parkId: string;
  initial: Hours;
}) {
  const [hours, setHours] = useState<Hours>(() => {
    const base: Hours = {};
    for (const d of DAYS) {
      base[d.key] = initial?.[d.key] ?? { open: "10:00", close: "18:00", closed: false };
    }
    return base;
  });
  const [busy, setBusy] = useState(false);

  const update = (day: string, patch: Partial<Hours[string]>) =>
    setHours((h) => ({ ...h, [day]: { ...h[day], ...patch } }));

  const save = async () => {
    setBusy(true);
    if (getDemoPark(parkId)) {
      updateDemoPark(parkId, { opening_hours: hours });
      setBusy(false);
      toast.success("Öffnungszeiten gespeichert");
      return;
    }
    const { error } = await supabase.from("parks").update({ opening_hours: hours }).eq("id", parkId);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Öffnungszeiten gespeichert");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {DAYS.map((d) => (
          <div key={d.key} className="flex flex-wrap items-center gap-3 rounded-xl border bg-background p-3">
            <Label className="w-28 font-medium">{d.label}</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={!hours[d.key].closed}
                onCheckedChange={(v) => update(d.key, { closed: !v })}
              />
              <span className="text-sm text-muted-foreground">
                {hours[d.key].closed ? "Geschlossen" : "Geöffnet"}
              </span>
            </div>
            {!hours[d.key].closed && (
              <div className="ml-auto flex items-center gap-2">
                <Input
                  type="time"
                  value={hours[d.key].open}
                  onChange={(e) => update(d.key, { open: e.target.value })}
                  className="w-32"
                />
                <span>–</span>
                <Input
                  type="time"
                  value={hours[d.key].close}
                  onChange={(e) => update(d.key, { close: e.target.value })}
                  className="w-32"
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <Button onClick={save} disabled={busy}>
        {busy ? "Speichere…" : "Öffnungszeiten speichern"}
      </Button>
    </div>
  );
}
