import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InteractiveParkMap } from "@/components/visitor/interactive-park-map";
import { ItemPeek, ItemDetailSheet } from "@/components/visitor/item-sheets";
import type { Item } from "@/components/manage/items-manager";
import { STATUS_LABEL, TYPE_LABEL } from "@/lib/park-constants";
import { Clock, List, Map, MoreHorizontal, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/app/$resortSlug")({
  head: () => ({ meta: [{ title: "Park-App" }] }),
  component: VisitorApp,
});

type Resort = { id: string; name: string };
type Park = {
  id: string;
  name: string;
  map_image_url: string | null;
  opening_hours: Record<string, { open: string; close: string; closed: boolean }>;
};
type LinkBlock = { id: string; title: string; url: string; image_url: string | null };

function VisitorApp() {
  const { resortSlug } = Route.useParams();
  const [resort, setResort] = useState<Resort | null>(null);
  const [parks, setParks] = useState<Park[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [links, setLinks] = useState<LinkBlock[]>([]);
  const [activeTab, setActiveTab] = useState<string>(""); // park id or "more"
  const [view, setView] = useState<"map" | "list">("map");
  const [peek, setPeek] = useState<Item | null>(null);
  const [detail, setDetail] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: r } = await supabase
        .from("resorts")
        .select("id,name")
        .eq("slug", resortSlug)
        .maybeSingle();
      if (!r) {
        setLoading(false);
        return;
      }
      setResort(r);
      const { data: ps } = await supabase
        .from("parks")
        .select("id,name,map_image_url,opening_hours")
        .eq("resort_id", r.id)
        .order("created_at");
      setParks((ps ?? []) as Park[]);
      const ids = (ps ?? []).map((p) => p.id);
      if (ids.length) {
        const { data: its } = await supabase
          .from("park_items")
          .select("*")
          .in("park_id", ids);
        setItems((its ?? []) as Item[]);
        setActiveTab(ps![0].id);
      }
      const { data: ls } = await supabase
        .from("resort_links")
        .select("id,title,url,image_url")
        .eq("resort_id", r.id)
        .order("sort_order");
      setLinks(ls ?? []);
      setLoading(false);
    })();
  }, [resortSlug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Lade…
      </div>
    );
  }
  if (!resort) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-muted-foreground">
        Resort nicht gefunden.
      </div>
    );
  }

  const activePark = parks.find((p) => p.id === activeTab);
  const activeItems = activePark ? items.filter((i) => i.park_id === activePark.id) : [];

  return (
    <div className="relative min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b bg-card/80 px-4 py-3 backdrop-blur">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{resort.name}</p>
        <h1 className="font-bold">
          {activeTab === "more" ? "Mehr" : activePark?.name ?? ""}
        </h1>
      </header>

      <main className="pb-24">
        {activeTab === "more" ? (
          <MoreTab parks={parks} links={links} />
        ) : activePark ? (
          <>
            {/* View toggle */}
            <div className="sticky top-[60px] z-10 flex items-center justify-end gap-2 bg-background/90 px-4 py-2 backdrop-blur">
              <button
                onClick={() => setView(view === "map" ? "list" : "map")}
                className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm shadow-soft"
              >
                {view === "map" ? <List className="h-4 w-4" /> : <Map className="h-4 w-4" />}
                {view === "map" ? "Liste" : "Karte"}
              </button>
            </div>
            {view === "map" ? (
              <div className="h-[calc(100vh-180px)]">
                <InteractiveParkMap
                  mapUrl={activePark.map_image_url}
                  items={activeItems}
                  onItemClick={(it) => setPeek(it)}
                />
              </div>
            ) : (
              <ItemList items={activeItems} onSelect={(it) => setDetail(it)} />
            )}
          </>
        ) : null}
      </main>

      {/* Peek + Detail */}
      <ItemPeek
        item={peek}
        onOpen={() => {
          if (peek) setDetail(peek);
        }}
        onClose={() => setPeek(null)}
      />
      <ItemDetailSheet item={detail} onClose={() => setDetail(null)} />

      {/* Bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-card">
        <div className="mx-auto flex max-w-2xl items-stretch overflow-x-auto">
          {parks.map((p) => (
            <BottomTab
              key={p.id}
              active={activeTab === p.id}
              label={p.name}
              icon={<Map className="h-5 w-5" />}
              onClick={() => {
                setActiveTab(p.id);
                setPeek(null);
              }}
            />
          ))}
          <BottomTab
            active={activeTab === "more"}
            label="Mehr"
            icon={<MoreHorizontal className="h-5 w-5" />}
            onClick={() => {
              setActiveTab("more");
              setPeek(null);
            }}
          />
        </div>
      </nav>
    </div>
  );
}

function BottomTab({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-w-[72px] flex-1 flex-col items-center gap-0.5 px-3 py-2.5 text-xs transition ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {icon}
      <span className="max-w-full truncate">{label}</span>
    </button>
  );
}

function ItemList({ items, onSelect }: { items: Item[]; onSelect: (i: Item) => void }) {
  const groups: Record<string, Item[]> = { attraction: [], food: [], other: [] };
  for (const it of items) groups[it.type].push(it);
  return (
    <div className="space-y-6 p-4">
      {(["attraction", "food", "other"] as const).map((t) =>
        groups[t].length === 0 ? null : (
          <section key={t}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {TYPE_LABEL[t]}
            </h2>
            <div className="space-y-2">
              {groups[t].map((it) => (
                <button
                  key={it.id}
                  onClick={() => onSelect(it)}
                  className="flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-soft transition hover:-translate-y-0.5"
                >
                  {it.photo_url ? (
                    <img src={it.photo_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-gradient-hero" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{it.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {STATUS_LABEL[it.status]}
                    </p>
                  </div>
                  {it.show_wait_time && it.wait_time && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                      <Clock className="h-3 w-3" /> {it.wait_time}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        ),
      )}
      {items.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">Keine Einträge.</p>
      )}
    </div>
  );
}

function MoreTab({ parks, links }: { parks: Park[]; links: LinkBlock[] }) {
  const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  const dayLabels = { mon: "Mo", tue: "Di", wed: "Mi", thu: "Do", fri: "Fr", sat: "Sa", sun: "So" };
  return (
    <div className="space-y-6 p-4">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Öffnungszeiten
        </h2>
        <div className="space-y-3">
          {parks.map((p) => (
            <div key={p.id} className="rounded-2xl border bg-card p-4 shadow-soft">
              <p className="font-semibold">{p.name}</p>
              <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs">
                {dayKeys.map((d) => {
                  const h = p.opening_hours?.[d];
                  return (
                    <div key={d} className="rounded-lg bg-muted/50 p-1.5">
                      <p className="font-medium">{dayLabels[d]}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {h?.closed || !h ? "Zu" : `${h.open}–${h.close}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Mehr Infos
        </h2>
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Links.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {links.map((l) => (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-hero p-4 text-center text-primary-foreground shadow-soft transition hover:-translate-y-1 hover:shadow-elevated"
              >
                <ExternalLink className="h-7 w-7" />
                <span className="font-semibold leading-tight">{l.title}</span>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
