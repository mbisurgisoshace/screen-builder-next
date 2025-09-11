// components/live/ActiveUsersBar.tsx
"use client";

import * as React from "react";
import { useOthers, useSelf, useMyPresence } from "@liveblocks/react";

// Utils
function initialsOf(nameOrEmail?: string) {
  if (!nameOrEmail) return "";
  const base = nameOrEmail.split("@")[0]; // if it's an email
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
function colorFor(id: string | number) {
  const i = Math.abs(hashString(String(id))) % COLORS.length;
  return COLORS[i];
}
function hashString(s: string) {
  // simple stable hash
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

type Props = {
  maxVisible?: number;
  includeSelf?: boolean;
  className?: string;
};

export function ActiveUsersBar({
  maxVisible = 3,
  includeSelf = true,
  className = "",
}: Props) {
  const self = useSelf();
  const others = useOthers(); // array of connections in this room
  // Deduplicate by "userId" when provided via auth; fall back to connectionId
  const seen = new Set<string>();
  const participants = [
    ...(includeSelf && self ? [self] : []),
    ...others,
  ].filter((u) => {
    const userId =
      // @ts-ignore – Liveblocks exposes userId on connection when using auth
      (u.userId as string | undefined) ??
      (u.info as any)?.userId ??
      String(u.connectionId); // fallback per-tab
    if (seen.has(String(userId))) return false;
    seen.add(String(userId));
    return true;
  });

  const visible = participants.slice(0, maxVisible);
  const overflow = participants.length - visible.length;

  return (
    <div className={`flex items-center ${className}`}>
      {visible.map((u) => {
        const info = (u.info as any) || {};
        const displayName =
          info.name || info.username || info.email || u.id || "User";
        const userId =
          // @ts-ignore
          u.userId ?? info.userId ?? u.connectionId;
        const bg = info.color || colorFor(userId);

        return (
          <div
            key={String(userId) + "-" + String(u.connectionId)}
            title={displayName}
            className="w-8 h-8 border border-white rounded-full grid place-items-center text-[11px] font-semibold shadow-sm -ml-1"
            style={{
              background: bg,
              color: "#111827",
            }}
          >
            {initialsOf(displayName)}
          </div>
        );
      })}

      {overflow > 0 && (
        <div
          className="w-8 h-8 rounded-full grid place-items-center text-[11px] font-semibold text-gray-600 bg-white border border-gray-200"
          title={`${overflow} more`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
