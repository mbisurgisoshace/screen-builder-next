import { useMemo, useRef, useState } from "react";
import { Shape, Position } from "../types";

/** Relative anchor inside a shape (0..1 in both axes) */
export type Anchor = { x: number; y: number };

/** A persisted connection between two shapes via relative anchors */
export type Connection = {
  id: string;
  fromShapeId: number;
  fromAnchor: Anchor;
  toShapeId: number;
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
  // Guard against zero width/height to avoid NaN on weird shapes
  const w = shape.width || 1;
  const h = shape.height || 1;
  return {
    x: (point.x - shape.x) / w,
    y: (point.y - shape.y) / h,
  };
}

/** Helper: find a shape by id (tiny convenience) */
function byId(shapes: Shape[], id: number) {
  return shapes.find((s) => s.id === id) || null;
}

/**
 * Centralized connection manager:
 * - Holds the array of connections
 * - Adds/removes/updates connections
 * - Computes absolute endpoints for rendering
 *
 * It’s storage-agnostic (plain React state). Later we can swap this
 * to Liveblocks or Zustand without touching arrow/shape logic.
 */
export function useConnectionManager(initial: Connection[] = []) {
  const [connections, setConnections] = useState<Connection[]>(initial);

  // simple id generator (you can swap with nanoid)
  const idRef = useRef(1);
  const genId = () => `conn_${idRef.current++}`;

  /** Add a connection using fully-relative data */
  function addConnectionRelative(input: {
    fromShapeId: number;
    fromAnchor: Anchor;
    toShapeId: number;
    toAnchor: Anchor;
  }) {
    const conn: Connection = {
      id: genId(),
      ...input,
    };
    setConnections((prev) => [...prev, conn]);
    return conn;
  }

  /** Remove a connection by id */
  function removeConnection(id: string) {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  }

  /** Patch/update a connection by id */
  function updateConnection(id: string, patch: Partial<Connection>) {
    setConnections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  }

  /**
   * Finalize a connection from your current “connecting” state + a snap result.
   * - connecting.fromPosition is absolute (canvas/world space)
   * - snapResult.snappedPosition is absolute
   * - We convert both to relative anchors and persist
   */
  function finalizeFromSnap(args: {
    connecting: {
      fromShapeId: number;
      fromDirection: "top" | "right" | "bottom" | "left"; // not strictly required, but you have it
      fromPosition: Position; // absolute world coords where the drag started
    };
    snapResult: {
      shapeId: number;
      snappedPosition: Position; // absolute world coords where the line snapped
    };
    shapes: Shape[];
  }) {
    const { connecting, snapResult, shapes } = args;

    const from = byId(shapes, connecting.fromShapeId);
    const to = byId(shapes, snapResult.shapeId);
    if (!from || !to) return null;

    const fromAnchor = computeRelativeAnchor(from, connecting.fromPosition);
    const toAnchor = computeRelativeAnchor(to, snapResult.snappedPosition);

    return addConnectionRelative({
      fromShapeId: connecting.fromShapeId,
      fromAnchor,
      toShapeId: snapResult.shapeId,
      toAnchor,
    });
  }

  /**
   * Compute absolute endpoints for rendering all connections against current shapes.
   * Returns a memoized list so you can map and render <CurvedArrow from={...} to={...} />
   */
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
          .filter(Boolean) as {
          id: string;
          from: Position;
          to: Position;
          connection: Connection;
        }[],
      [connections, shapes]
    );
  }

  /**
   * (Optional) helpers for UX:
   * - get connections touching a given shape
   * - replace one endpoint (e.g., while editing)
   */

  function getConnectionsForShape(shapeId: number) {
    return connections.filter(
      (c) => c.fromShapeId === shapeId || c.toShapeId === shapeId
    );
  }

  function replaceEndpointWithAbsolute(args: {
    id: string;
    endpoint: "from" | "to";
    shapeId: number;
    absolutePoint: Position;
    shapes: Shape[];
  }) {
    const { id, endpoint, shapeId, absolutePoint, shapes } = args;
    const shape = byId(shapes, shapeId);
    if (!shape) return;

    const anchor = computeRelativeAnchor(shape, absolutePoint);

    updateConnection(
      id,
      endpoint === "from"
        ? { fromShapeId: shapeId, fromAnchor: anchor }
        : { toShapeId: shapeId, toAnchor: anchor }
    );
  }

  return {
    // state
    connections,
    setConnections,

    // core ops
    addConnectionRelative,
    removeConnection,
    updateConnection,
    finalizeFromSnap,

    // computed endpoints for rendering
    useConnectionEndpoints,

    // optional helpers
    getConnectionsForShape,
    replaceEndpointWithAbsolute,
  };
}
