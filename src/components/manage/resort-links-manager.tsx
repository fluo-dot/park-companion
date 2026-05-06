import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { createDemoLink, deleteDemoLink, loadDemoLinks } from "@/lib/demo-store";

type Link = { id: string; title: string; url: string; image_url: string | null };

export function ResortLinksManager({ resortId }: { resortId: string }) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (resortId.startsWith("resort_")) {
      setLinks(loadDemoLinks(resortId));
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("resort_links")
      .select("id,title,url,image_url")
      .eq("resort_id", resortId)
      .order("sort_order");
    setLinks(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resortId]);

  const remove = async (id: string) => {
    if (!confirm("Link löschen?")) return;
    if (resortId.startsWith("resort_")) {
      deleteDemoLink(id);
      load();
      return;
    }
    await supabase.from("resort_links").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Werden in der Besucher-App im „Mehr"-Tab als Blöcke angezeigt.
        </p>
        <NewLinkDialog resortId={resortId} onSaved={load} />
      </div>
      {loading ? (
        <p className="text-muted-foreground">Lade…</p>
      ) : links.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          Noch keine Links.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {links.map((l) => (
            <div key={l.id} className="flex items-center gap-3 rounded-2xl border bg-background p-4">
              <ExternalLink className="h-5 w-5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{l.title}</p>
                <p className="truncate text-xs text-muted-foreground">{l.url}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(l.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewLinkDialog({ resortId, onSaved }: { resortId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim() || !url.trim()) return;
    setBusy(true);
    if (resortId.startsWith("resort_")) {
      createDemoLink({ resortId, title: title.trim(), url: url.trim() });
      setBusy(false);
      toast.success("Link hinzugefügt");
      setOpen(false);
      setTitle("");
      setUrl("");
      onSaved();
      return;
    }
    const { error } = await supabase.from("resort_links").insert({
      resort_id: resortId,
      title: title.trim(),
      url: url.trim(),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Link hinzugefügt");
    setOpen(false);
    setTitle("");
    setUrl("");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Link hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuer Link</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Titel</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tickets" />
          </div>
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              type="url"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy || !title.trim() || !url.trim()}>
            {busy ? "Speichere…" : "Hinzufügen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
