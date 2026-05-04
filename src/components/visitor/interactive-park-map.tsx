import { useEffect, useRef, useState } from "react";
import type { Item } from "@/components/manage/items-manager";

type Props = {
  mapUrl: string | null;
  items: Item[];
  onItemClick: (item: Item) => void;
};

/** Pinch/scroll zoom + pan, with pins overlaid at relative coords (0..1). */
export function InteractiveParkMap({ mapUrl, items, onItemClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      setScale((s) => Math.min(4, Math.max(1, s + s * delta)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, tx, ty };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setTx(dragRef.current.tx + (e.clientX - dragRef.current.x));
    setTy(dragRef.current.ty + (e.clientY - dragRef.current.y));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const reset = () => {
    setScale(1);
    setTx(0);
    setTy(0);
  };

  if (!mapUrl) {
    return (
      <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
        Keine Parkkarte hochgeladen
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none select-none overflow-hidden bg-muted"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="absolute left-1/2 top-1/2 origin-center"
        style={{
          transform: `translate(-50%,-50%) translate(${tx}px, ${ty}px) scale(${scale})`,
          transition: dragRef.current ? "none" : "transform 0.15s ease",
        }}
      >
        <div className="relative">
          <img
            src={mapUrl}
            alt="Parkplan"
            className="max-h-[80vh] max-w-[90vw] rounded-2xl shadow-soft"
            draggable={false}
          />
          {items
            .filter((it) => it.map_x != null && it.map_y != null)
            .map((it) => (
              <button
                key={it.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onItemClick(it);
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-primary p-2 text-primary-foreground shadow-elevated ring-2 ring-background"
                style={{
                  left: `${(it.map_x ?? 0) * 100}%`,
                  top: `${(it.map_y ?? 0) * 100}%`,
                }}
                aria-label={it.name}
              >
                <span className="block h-2 w-2 rounded-full bg-primary-foreground" />
              </button>
            ))}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute right-3 top-3 flex flex-col gap-1 rounded-xl bg-background/90 p-1 shadow-soft backdrop-blur">
        <button
          onClick={() => setScale((s) => Math.min(4, s + 0.3))}
          className="h-8 w-8 rounded-lg text-lg hover:bg-muted"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => setScale((s) => Math.max(1, s - 0.3))}
          className="h-8 w-8 rounded-lg text-lg hover:bg-muted"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          onClick={reset}
          className="h-8 w-8 rounded-lg text-xs hover:bg-muted"
          aria-label="Zurücksetzen"
        >
          ⟲
        </button>
      </div>
    </div>
  );
}
