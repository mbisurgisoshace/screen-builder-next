"use client";

import { ReactNode } from "react";
import {
  RoomProvider,
  LiveblocksProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { LiveList } from "@liveblocks/client";

interface RoomProps {
  roomId: string;
  children: ReactNode;
}

export function Room({ roomId, children }: RoomProps) {
  return (
    <LiveblocksProvider
      throttle={16}
      // publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!}
      authEndpoint={"/api/liveblocks-auth"}
    >
      <RoomProvider
        id={`${roomId}`}
        initialStorage={{
          shapes: new LiveList([]),
          comments: new LiveList([]),
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
