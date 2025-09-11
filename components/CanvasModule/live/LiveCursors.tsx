// components/live/LiveCursors.tsx
"use client";

import * as React from "react";
import { useOthers, useMyPresence } from "@liveblocks/react";

type Vec = { x: number; y: number };

type Props = {
  /** The transformed drawing layer sits inside this ref */
  canvasRef: React.RefObject<HTMLDivElement | null>;
  /** Current world transform */
  position: { x: number; y: number };
  scale: number;
  /** Show your own cursor too (off by default) */
  includeSelf?: boolean;
  /** z-index on the transformed layer */
  zIndex?: number;
};

function initialsOf(nameOrEmail?: string) {
  if (!nameOrEmail) return "";
  const base = nameOrEmail.split("@")[0];
  const words = base.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
const COLORS = [
  "#FDE68A",
  "#FDBA74",
  "#FCA5A5",
  "#FECACA",
  "#BFDBFE",
  "#C7D2FE",
  "#DDD6FE",
  "#E9D5FF",
  "#FBCFE8",
  "#A7F3D0",
  "#FCD34D",
];
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};
const colorFor = (id: string | number, fallback?: string) =>
  fallback ?? COLORS[hash(String(id)) % COLORS.length];

export function LiveCursors({
  canvasRef,
  position,
  scale,
  includeSelf = false,
  zIndex = 600,
}: Props) {
  const others = useOthers();
  const [, setMyPresence] = useMyPresence();

  // Broadcast my cursor in WORLD coords (so everyone can render using their own zoom/pan)
  React.useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    let raf = 0;
    let queued: MouseEvent | null = null;

    const toWorld = (e: MouseEvent): Vec | null => {
      const rect = el.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!inside) return null;
      return {
        x: (e.clientX - rect.left - position.x) / scale,
        y: (e.clientY - rect.top - position.y) / scale,
      };
    };

    const flush = () => {
      if (!queued) return;
      const world = toWorld(queued);
      queued = null;
      if (world) {
        setMyPresence({
          // Liveblocks presence merges shallowly
          cursor: world,
          cursorTs: Date.now(),
        } as any);
      }
      raf = 0;
    };

    const onMove = (e: MouseEvent) => {
      queued = e;
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const onLeave = () => setMyPresence({ cursor: null } as any);
    const onBlur = () => setMyPresence({ cursor: null } as any);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onBlur);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [canvasRef, position.x, position.y, scale, setMyPresence]);

  // Render others
  const now = Date.now();
  const peers = others
    .map((o) => {
      const p: any = o.presence;
      const info: any = o.info || {};
      const userId =
        // userId from auth if present, else connectionId as fallback
        // @ts-ignore
        o.userId ?? info.userId ?? o.connectionId;
      const name = info.name || info.email || `User ${o.connectionId}`;
      const color = colorFor(userId, info.color);
      return {
        id: `${String(userId)}-${o.connectionId}`,
        cursor: p?.cursor as Vec | null | undefined,
        ts: p?.cursorTs as number | undefined,
        name,
        color,
      };
    })
    .filter((x) => x.cursor);

  // Optionally include self cursor (handy for testing)
  // You can use useSelf().presence if you want to display it too.

  return (
    <div
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex }}
    >
      {peers.map((u) => {
        const { x, y } = u.cursor!;
        const stale = u.ts ? now - u.ts > 4000 : false;
        return (
          <div
            key={u.id}
            className="absolute select-none"
            style={{
              left: x,
              top: y,
              opacity: stale ? 0.35 : 1,
              transform: "translate(-2px, -10px)", // nudge so tip feels precise
            }}
          >
            {/* Pointer glyph */}
            <svg
              width="14"
              height="20"
              viewBox="0 0 14 20"
              className="drop-shadow"
              style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))" }}
            >
              <path
                d="M1.5 1.5 L11 10 L7.9 10 L9.4 17 L6.7 18 L5.1 10.8 L2.9 13.3 Z"
                fill={u.color}
                stroke="rgba(0,0,0,0.25)"
                strokeWidth="0.5"
              />
            </svg>

            {/* Label pill */}
            <div
              className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{
                background: "rgba(255,255,255,0.95)",
                color: "#111827",
                border: "1px solid rgba(0,0,0,0.06)",
                width: "max-content",
              }}
            >
              {initialsOf(u.name)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
