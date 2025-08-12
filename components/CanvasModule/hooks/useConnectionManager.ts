"use client";

import { useMemo, useRef, useState } from "react";
import { LiveList, LiveObject } from "@liveblocks/client";
//import { useStorage, useMutation } from "@/app/liveblocks";
import { Shape, Position } from "../types";
import { useMutation, useStorage } from "@liveblocks/react";

/** Relative anchor inside a shape (0..1 in both axes) */
export type Anchor = { x: number; y: number };

/** A persisted connection between two shapes via relative anchors */
export type Connection = {
  id: string;
  fromShapeId: Shape["id"]; // matches your Shape id type (number or string)
  fromAnchor: Anchor;
  toShapeId: Shape["id"];
  toAnchor: Anchor;
};

/** Helper: absolute pos from a shape + relative anchor */
export function getAbsoluteAnchorPosition(
  shape: Shape,
  anchor: Anchor
): Position {
  return {
    x: shape.x + shape.width * anchor.x,
    y: shape.y + shape.height * anchor.y,
  };
}

/** Helper: convert absolute point to relative anchor for a given shape */
export function computeRelativeAnchor(shape: Shape, point: Position): Anchor {
  const w = shape.width || 1;
  const h = shape.height || 1;
  // Clamp to [0,1] so arrows stay on edges even on tiny numerical drift
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  return {
    x: clamp01((point.x - shape.x) / w),
    y: clamp01((point.y - shape.y) / h),
  };
}

/** Helper: find a shape by id (tiny convenience) */
function byId(shapes: Shape[], id: Shape["id"]) {
  return shapes.find((s) => s.id === id) || null;
}

/**
 * Centralized connection manager (Liveblocks-powered):
 * - Reads connections from Liveblocks Storage (root.connections: LiveList<LiveObject>)
 * - Adds/removes/updates connections via mutations
 * - Computes absolute endpoints for rendering
 *
 * Selection state is kept local (not shared).
 */
export function useConnectionManager() {
  const storage = useStorage((root) => root);
  const liveConnections = useStorage((root) => root.connections);

  // READ (plain snapshots for render)
  // const connections: Connection[] =
  //   useStorage((root) => {
  //     const list = root.connections as
  //       | LiveList<LiveObject<Connection>>
  //       | undefined;
  //     if (!list) return [];
  //     // Avoid .toObject() (not present on proxied snapshots). Read fields explicitly.
  //     const result: Connection[] = [];
  //     for (let i = 0; i < list.length; i++) {
  //       const lo = list.get(i)!;
  //       result.push({
  //         id: lo.get("id") as string,
  //         fromShapeId: lo.get("fromShapeId") as Shape["id"],
  //         fromAnchor: lo.get("fromAnchor") as Anchor,
  //         toShapeId: lo.get("toShapeId") as Shape["id"],
  //         toAnchor: lo.get("toAnchor") as Anchor,
  //       });
  //     }
  //     return result;
  //   }) ?? [];

  const connections: Connection[] = useMemo(() => {
    if (!liveConnections) return [];
    // return liveShapes.map(fromLiveShape);

    return liveConnections as Connection[];
  }, [liveConnections, storage]);

  // WRITE: push a new connection
  const addConnectionRelative = useMutation(
    ({ storage }, input: Omit<Connection, "id"> & { id?: string }) => {
      const list = storage.get("connections") as LiveList<
        LiveObject<Connection>
      >;
      const id = input.id ?? crypto.randomUUID();
      const conn: Connection = { id, ...input } as Connection;
      list.push(new LiveObject(conn));
      return id;
    },
    []
  );

  // WRITE: remove by id(s)
  const removeConnection = useMutation(({ storage }, id: string) => {
    const list = storage.get("connections") as LiveList<LiveObject<Connection>>;
    for (let i = list.length - 1; i >= 0; i--) {
      const lo = list.get(i)!;
      if ((lo.get("id") as string) === id) {
        list.delete(i);
        break;
      }
    }
  }, []);

  const removeConnectionsByIds = useMutation(({ storage }, ids: string[]) => {
    const set = new Set(ids);
    const list = storage.get("connections") as LiveList<LiveObject<Connection>>;
    for (let i = list.length - 1; i >= 0; i--) {
      const lo = list.get(i)!;
      if (set.has(lo.get("id") as string)) list.delete(i);
    }
  }, []);

  // WRITE: patch/update by id
  const updateConnection = useMutation(
    ({ storage }, params: { id: string; patch: Partial<Connection> }) => {
      const list = storage.get("connections") as LiveList<
        LiveObject<Connection>
      >;
      for (let i = 0; i < list.length; i++) {
        const lo = list.get(i)!;
        if ((lo.get("id") as string) === params.id) {
          const { patch } = params;
          // set only provided fields
          if (patch.fromShapeId !== undefined)
            lo.set("fromShapeId", patch.fromShapeId);
          if (patch.toShapeId !== undefined)
            lo.set("toShapeId", patch.toShapeId);
          if (patch.fromAnchor !== undefined)
            lo.set("fromAnchor", patch.fromAnchor);
          if (patch.toAnchor !== undefined) lo.set("toAnchor", patch.toAnchor);
          break;
        }
      }
    },
    []
  );

  /**
   * Finalize a connection from your current “connecting” state + a snap result.
   * Converts absolute points to relative anchors and persists to Liveblocks.
   */
  function finalizeFromSnap(args: {
    connecting: {
      fromShapeId: Shape["id"];
      fromDirection?: "top" | "right" | "bottom" | "left";
      fromPosition: Position; // world coords where the drag started
    };
    snapResult: {
      shapeId: Shape["id"];
      snappedPosition: Position; // world coords where the line snapped
    };
    shapes: Shape[];
  }) {
    const { connecting, snapResult, shapes } = args;

    const from = byId(shapes, connecting.fromShapeId);
    const to = byId(shapes, snapResult.shapeId);
    if (!from || !to) return null;

    const fromAnchor = computeRelativeAnchor(from, connecting.fromPosition);
    const toAnchor = computeRelativeAnchor(to, snapResult.snappedPosition);

    const id = addConnectionRelative({
      fromShapeId: connecting.fromShapeId,
      fromAnchor,
      toShapeId: snapResult.shapeId,
      toAnchor,
    });

    return id;
  }

  /** Compute absolute endpoints for rendering against current shapes */
  function useConnectionEndpoints(shapes: Shape[]) {
    return useMemo(
      () =>
        connections
          .map((c) => {
            const from = byId(shapes, c.fromShapeId);
            const to = byId(shapes, c.toShapeId);
            if (!from || !to) return null;
            return {
              id: c.id,
              from: getAbsoluteAnchorPosition(from, c.fromAnchor),
              to: getAbsoluteAnchorPosition(to, c.toAnchor),
              connection: c,
            };
          })
          .filter(Boolean) as Array<{
          id: string;
          from: Position;
          to: Position;
          connection: Connection;
        }>,
      [connections, shapes]
    );
  }

  /** Optional helpers */
  // function getConnectionsForShape(shapeId: Shape["id"]) {
  //   return connections.filter(
  //     (c) => c.fromShapeId === shapeId || c.toShapeId === shapeId
  //   );
  // }

  function replaceEndpointWithAbsolute(args: {
    id: string;
    endpoint: "from" | "to";
    shapeId: Shape["id"];
    absolutePoint: Position;
    shapes: Shape[];
  }) {
    const { id, endpoint, shapeId, absolutePoint, shapes } = args;
    const shape = byId(shapes, shapeId);
    if (!shape) return;
    const anchor = computeRelativeAnchor(shape, absolutePoint);
    updateConnection({
      id,
      patch:
        endpoint === "from"
          ? { fromShapeId: shapeId, fromAnchor: anchor }
          : { toShapeId: shapeId, toAnchor: anchor },
    });
  }

  // Local (non-shared) connection selection
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);
  function selectConnection(id: string | null) {
    setSelectedConnectionId(id);
  }
  function removeSelectedConnection() {
    if (!selectedConnectionId) return;
    removeConnection(selectedConnectionId);
    setSelectedConnectionId(null);
  }

  return {
    // live snapshots
    connections,

    // core ops (persisted)
    addConnectionRelative,
    removeConnection,
    removeConnectionsByIds,
    updateConnection,
    finalizeFromSnap,

    // selection (local)
    selectedConnectionId,
    selectConnection,
    removeSelectedConnection,

    // computed endpoints for rendering
    useConnectionEndpoints,

    // helpers
    //getConnectionsForShape,
    replaceEndpointWithAbsolute,
  };
}
