import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Sparkles } from "lucide-react";
import { OpeningHoursEditor } from "@/components/manage/opening-hours-editor";
import { MapUploader } from "@/components/manage/map-uploader";
import { ItemsManager } from "@/components/manage/items-manager";
import { ResortLinksManager } from "@/components/manage/resort-links-manager";
import { MapPlacementEditor } from "@/components/manage/map-placement-editor";
import { getDemoPark, getDemoResortName, isDemoUser } from "@/lib/demo-store";

export const Route = createFileRoute("/manage/$parkId")({
  head: () => ({ meta: [{ title: "Park managen — ParkPilot" }] }),
  component: ManagePage,
});

type Park = {
  id: string;
  name: string;
  description: string | null;
  resort_id: string;
  map_image_url: string | null;
  opening_hours: Record<string, { open: string; close: string; closed: boolean }>;
};

function ManagePage() {
  const { parkId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [park, setPark] = useState<Park | null>(null);
  const [resortName, setResortName] = useState("");
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    if (isDemoUser(user)) {
      const p = getDemoPark(parkId);
      if (!p) {
        setBusy(false);
        return;
      }
      setPark(p as Park);
      setResortName(getDemoResortName(p.resort_id));
      setBusy(false);
      return;
    }
    const { data: p } = await supabase
      .from("parks")
      .select("id,name,description,resort_id,map_image_url,opening_hours")
      .eq("id", parkId)
      .maybeSingle();
    if (!p) {
      setBusy(false);
      return;
    }
    setPark(p as Park);
    const { data: r } = await supabase
      .from("resorts")
      .select("name")
      .eq("id", p.resort_id)
      .maybeSingle();
    setResortName(r?.name ?? "");
    setBusy(false);
  }, [parkId, user]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading || busy) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Lade…
      </div>
    );
  }
  if (!park) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Park nicht gefunden.</p>
        <Link to="/dashboard">
          <Button>Zurück zum Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </span>
            Dashboard
          </Link>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{resortName}</p>
            <h1 className="font-semibold">{park.name}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="hours">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="hours">Öffnungszeiten</TabsTrigger>
            <TabsTrigger value="map">Parkkarte</TabsTrigger>
            <TabsTrigger value="placement">Platzierung</TabsTrigger>
            <TabsTrigger value="attraction">Attraktionen</TabsTrigger>
            <TabsTrigger value="food">Gastronomie</TabsTrigger>
            <TabsTrigger value="other">Sonstiges</TabsTrigger>
            <TabsTrigger value="links">Resort-Links</TabsTrigger>
          </TabsList>

          <TabsContent value="hours" className="mt-6">
            <SectionCard title="Öffnungszeiten des Parks">
              <OpeningHoursEditor parkId={park.id} initial={park.opening_hours} />
            </SectionCard>
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            <SectionCard title="Parkkarte">
              <MapUploader
                parkId={park.id}
                currentUrl={park.map_image_url}
                onChange={(url) => setPark({ ...park, map_image_url: url })}
              />
            </SectionCard>
          </TabsContent>

          <TabsContent value="attraction" className="mt-6">
            <SectionCard title="Attraktionen">
              <ItemsManager parkId={park.id} type="attraction" />
            </SectionCard>
          </TabsContent>
          <TabsContent value="food" className="mt-6">
            <SectionCard title="Gastronomie">
              <ItemsManager parkId={park.id} type="food" />
            </SectionCard>
          </TabsContent>
          <TabsContent value="other" className="mt-6">
            <SectionCard title="Sonstiges">
              <ItemsManager parkId={park.id} type="other" />
            </SectionCard>
          </TabsContent>
          <TabsContent value="links" className="mt-6">
            <SectionCard title="Resort-Links (Mehr-Tab in der Besucher-App)">
              <ResortLinksManager resortId={park.resort_id} />
            </SectionCard>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border bg-card p-6 shadow-soft">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}
