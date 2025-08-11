// CanvasModule/hooks/useRealtimeConnections.ts
"use client";

import { LiveList, LiveObject } from "@liveblocks/client";

import { Connection } from "../useConnectionManager";
import { useMutation, useStorage } from "@liveblocks/react";

export function useRealtimeConnections() {
  // READ: selector returns plain snapshots you can render
  const connections: Connection[] =
    useStorage((root) => {
      const list = root.connections;
      if (!list) return [];
      return list.map((c: any) => c as Connection);
    }) ?? [];

  // WRITE: mutations operate on live tree
  const addConnection = useMutation(({ storage }, connection: Connection) => {
    const list = storage.get("connections") as LiveList<LiveObject<Connection>>;
    list.push(new LiveObject(connection));
  }, []);

  const removeConnectionsByIds = useMutation(({ storage }, ids: string[]) => {
    const list = storage.get("connections") as LiveList<LiveObject<Connection>>;
    const set = new Set(ids);
    for (let i = list.length - 1; i >= 0; i--) {
      const lo = list.get(i)!;
      if (set.has(lo.get("id") as string)) list.delete(i);
    }
  }, []);

  const removeConnectionsByShapeIds = useMutation(
    ({ storage }, shapeIds: number[]) => {
      const list = storage.get("connections") as LiveList<
        LiveObject<Connection>
      >;
      const set = new Set(shapeIds);
      for (let i = list.length - 1; i >= 0; i--) {
        const lo = list.get(i)!;
        const fromShapeId = lo.get("fromShapeId") as number;
        const toShapeId = lo.get("toShapeId") as number;
        if (set.has(fromShapeId) || set.has(toShapeId)) {
          list.delete(i);
        }
      }
    },
    []
  );

  return {
    connections,
    addConnection,
    removeConnectionsByIds,
    removeConnectionsByShapeIds,
  };
}
