import type { Item } from "@/components/manage/items-manager";
import { STATUS_LABEL } from "@/lib/park-constants";
import { Clock, X } from "lucide-react";

/** Small peek sheet that appears above the bottom navigation. */
export function ItemPeek({
  item,
  onOpen,
  onClose,
}: {
  item: Item | null;
  onOpen: () => void;
  onClose: () => void;
}) {
  if (!item) return null;
  return (
    <button
      onClick={onOpen}
      className="fixed inset-x-3 bottom-20 z-30 flex items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-elevated transition hover:-translate-y-0.5"
    >
      {item.photo_url ? (
        <img src={item.photo_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
      ) : (
        <div className="h-14 w-14 rounded-xl bg-gradient-hero" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{item.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {STATUS_LABEL[item.status]}
          {item.show_wait_time && item.wait_time && (
            <span className="ml-2 inline-flex items-center gap-1 text-primary">
              <Clock className="h-3 w-3" /> {item.wait_time} Min
            </span>
          )}
        </p>
      </div>
      <span
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
        aria-label="Schließen"
      >
        <X className="h-4 w-4" />
      </span>
    </button>
  );
}

/** Full-screen detail sheet. */
export function ItemDetailSheet({
  item,
  onClose,
}: {
  item: Item | null;
  onClose: () => void;
}) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background animate-in fade-in slide-in-from-bottom-4">
      <div className="relative h-72 w-full shrink-0 overflow-hidden">
        {item.photo_url ? (
          <img src={item.photo_url} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-hero" />
        )}
        <button
          onClick={onClose}
          className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 shadow-soft backdrop-blur"
          aria-label="Zurück"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 pb-24">
        <h2 className="text-2xl font-bold">{item.name}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
            {STATUS_LABEL[item.status]}
          </span>
          {item.show_wait_time && item.wait_time && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-primary-foreground">
              <Clock className="h-3 w-3" /> {item.wait_time} Min Wartezeit
            </span>
          )}
        </div>
        {item.description && (
          <p className="mt-6 whitespace-pre-line leading-relaxed">{item.description}</p>
        )}
        {item.important_info && (
          <div className="mt-6 rounded-2xl border-l-4 border-warning bg-warning/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-warning-foreground/70">
              Wichtige Informationen
            </p>
            <p className="mt-1 whitespace-pre-line">{item.important_info}</p>
          </div>
        )}
      </div>
    </div>
  );
}
