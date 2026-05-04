import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Sparkles, Plus, LogOut, ExternalLink, MapPin } from "lucide-react";
import { slugify } from "@/lib/slug";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ParkPilot" }] }),
  component: DashboardPage,
});

type Resort = { id: string; name: string; slug: string; description: string | null };
type Park = { id: string; resort_id: string; name: string; description: string | null };

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [parks, setParks] = useState<Park[]>([]);
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: rs } = await supabase
      .from("resorts")
      .select("id,name,slug,description")
      .eq("owner_id", user.id)
      .order("created_at");
    setResorts(rs ?? []);
    const ids = (rs ?? []).map((r) => r.id);
    if (ids.length) {
      const { data: ps } = await supabase
        .from("parks")
        .select("id,resort_id,name,description")
        .in("resort_id", ids)
        .order("created_at");
      setParks(ps ?? []);
    } else {
      setParks([]);
    }
    setBusy(false);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (loading || busy) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Lade…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </span>
            ParkPilot
          </Link>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Abmelden
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Deine Resorts</h1>
            <p className="mt-1 text-muted-foreground">
              Verwalte Resorts und ihre Parks. Jedes Resort hat eine eigene Besucher-App.
            </p>
          </div>
          <NewResortDialog onCreated={load} />
        </div>

        {resorts.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed bg-card p-10 text-center">
            <p className="text-muted-foreground">
              Du hast noch keine Resorts. Lege dein erstes Resort an, um zu starten.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {resorts.map((r) => {
              const rParks = parks.filter((p) => p.resort_id === r.id);
              return (
                <section
                  key={r.id}
                  className="rounded-3xl border bg-card p-6 shadow-soft"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">{r.name}</h2>
                      {r.description && (
                        <p className="text-sm text-muted-foreground">{r.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`/app/${r.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Besucher-App
                        </Button>
                      </a>
                      <NewParkDialog resortId={r.id} onCreated={load} />
                    </div>
                  </div>

                  {rParks.length === 0 ? (
                    <p className="mt-6 text-sm text-muted-foreground">
                      Noch keine Parks. Füge deinen ersten Park hinzu.
                    </p>
                  ) : (
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {rParks.map((p) => (
                        <Link
                          key={p.id}
                          to="/manage/$parkId"
                          params={{ parkId: p.id }}
                          className="group rounded-2xl border bg-background p-5 transition hover:-translate-y-1 hover:shadow-elevated"
                        >
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                              <MapPin className="h-5 w-5" />
                            </span>
                            <h3 className="font-semibold group-hover:text-primary">
                              {p.name}
                            </h3>
                          </div>
                          {p.description && (
                            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                              {p.description}
                            </p>
                          )}
                          <p className="mt-4 text-xs font-medium text-primary">
                            Park managen →
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function NewResortDialog({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user || !name.trim()) return;
    setBusy(true);
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("resorts").insert({
      owner_id: user.id,
      name: name.trim(),
      description: description.trim() || null,
      slug,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Resort erstellt");
    setOpen(false);
    setName("");
    setDescription("");
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Neues Resort
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neues Resort</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Erlebnis-Resort Süd" />
          </div>
          <div className="space-y-2">
            <Label>Beschreibung (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy || !name.trim()}>
            {busy ? "Speichere…" : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewParkDialog({ resortId, onCreated }: { resortId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const defaultHours = {
    mon: { open: "10:00", close: "18:00", closed: false },
    tue: { open: "10:00", close: "18:00", closed: false },
    wed: { open: "10:00", close: "18:00", closed: false },
    thu: { open: "10:00", close: "18:00", closed: false },
    fri: { open: "10:00", close: "18:00", closed: false },
    sat: { open: "10:00", close: "19:00", closed: false },
    sun: { open: "10:00", close: "19:00", closed: false },
  };

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("parks").insert({
      resort_id: resortId,
      name: name.trim(),
      description: description.trim() || null,
      opening_hours: defaultHours,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Park erstellt");
    setOpen(false);
    setName("");
    setDescription("");
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Park hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuen Park hinzufügen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Abenteuerland" />
          </div>
          <div className="space-y-2">
            <Label>Beschreibung (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy || !name.trim()}>
            {busy ? "Speichere…" : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
