"use client";

import { ReactNode } from "react";
import {
  RoomProvider,
  LiveblocksProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { LiveList } from "@liveblocks/client";

export function Room({ children }: { children: ReactNode }) {
  return (
    <LiveblocksProvider
      throttle={16}
      publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!}
    >
      <RoomProvider
        id="my-room"
        initialStorage={{
          shapes: new LiveList([]),
          connections: new LiveList([]),
        }}
      >
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
