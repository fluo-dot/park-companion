import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { fileToDataUrl, isDemoUser, updateDemoPark } from "@/lib/demo-store";

export function MapUploader({
  parkId,
  currentUrl,
  onChange,
}: {
  parkId: string;
  currentUrl: string | null;
  onChange: (url: string | null) => void;
}) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    if (!user) return;
    setBusy(true);
    if (isDemoUser(user)) {
      const url = await fileToDataUrl(file);
      updateDemoPark(parkId, { map_image_url: url });
      setBusy(false);
      toast.success("Parkkarte gespeichert");
      onChange(url);
      return;
    }
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/parks/${parkId}/map-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("park-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setBusy(false);
      return toast.error(upErr.message);
    }
    const { data } = supabase.storage.from("park-assets").getPublicUrl(path);
    const url = data.publicUrl;
    const { error: updErr } = await supabase
      .from("parks")
      .update({ map_image_url: url })
      .eq("id", parkId);
    setBusy(false);
    if (updErr) return toast.error(updErr.message);
    toast.success("Parkkarte hochgeladen");
    onChange(url);
  };

  return (
    <div className="space-y-4">
      {currentUrl ? (
        <img
          src={currentUrl}
          alt="Parkkarte"
          className="max-h-96 w-full rounded-2xl border object-contain"
        />
      ) : (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed text-muted-foreground">
          Noch keine Parkkarte hochgeladen
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />
      <Button onClick={() => inputRef.current?.click()} disabled={busy}>
        <Upload className="mr-2 h-4 w-4" />
        {busy ? "Lädt hoch…" : currentUrl ? "Karte ersetzen" : "Karte hochladen"}
      </Button>
    </div>
  );
}
