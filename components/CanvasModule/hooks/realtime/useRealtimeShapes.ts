// components/CanvasModule/hooks/useRealtimeShapes.ts
"use client";
import { useEffect, useMemo } from "react";
import { LiveList, LiveObject } from "@liveblocks/client";
import { useMutation, useStorage } from "@liveblocks/react";

import { Shape, ShapeType } from "../../types";

function toLiveShape(shape: Shape) {
  // keep keys flat & serializable
  return new LiveObject({
    id: shape.id,
    type: shape.type,
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height,
    color: shape.color,
    text: shape.text ?? null,
  });
}

function fromLiveShape(obj: LiveObject<any>): Shape {
  //const v = obj.get() as any;
  // return {
  //   id: v.id,
  //   type: v.type,
  //   x: v.x,
  //   y: v.y,
  //   width: v.width,
  //   height: v.height,
  //   color: v.color,
  //   text: v.text ?? undefined,
  // };
  return {
    id: obj.get("id")!,
    type: obj.get("type")!,
    x: obj.get("x")!,
    y: obj.get("y")!,
    width: obj.get("width")!,
    height: obj.get("height")!,
    color: obj.get("color")!,
    text: obj.get("text") ?? undefined,
  };
}

export function useRealtimeShapes() {
  // Liveblocks storage tree
  const storage = useStorage((root) => root); // { shapes: LiveList, connections: LiveList }
  //const liveShapes = storage?.shapes as LiveList<LiveObject<any>> | undefined;
  const liveShapes = useStorage((root) => root.shapes);

  // Read shapes as plain objects for rendering
  const shapes: Shape[] = useMemo(() => {
    if (!liveShapes) return [];
    // return liveShapes.map(fromLiveShape);

    return liveShapes as Shape[];
  }, [liveShapes, storage]);

  // Seed once if empty (optional — you can also do a one-time migration)
  useEffect(() => {
    if (!liveShapes) return;
    if (liveShapes.length === 0) {
      // no-op: we’ll let your existing add logic populate;
      // or, if you want a default rect, add it here
    }
  }, [liveShapes]);

  // Mutations
  const addShape = useMutation(
    ({ storage }, type: ShapeType, x: number, y: number, nextId: string) => {
      const list = storage.get("shapes") as LiveList<LiveObject<any>>;
      const shape: Shape = {
        id: nextId,
        type,
        x,
        y,
        width: type === "text" ? 120 : type === "interview" ? 580 : 160,
        height: type === "text" ? 40 : type === "interview" ? 228 : 112,
        color: "bg-blue-500",
        text: type === "text" ? "New text" : undefined,
      };
      list.push(toLiveShape(shape));
    },
    []
  );

  const updateShape = useMutation(
    ({ storage }, id: string, updater: (s: Shape) => Shape) => {
      const list = storage.get("shapes") as LiveList<LiveObject<any>>;
      for (let i = 0; i < list.length; i++) {
        const lo = list.get(i)!;
        const s = fromLiveShape(lo);
        if (s.id === id) {
          // const ns = updater(s);
          // // batch updates to the LiveObject
          // lo.update({
          //   x: ns.x,
          //   y: ns.y,
          //   width: ns.width,
          //   height: ns.height,
          //   color: ns.color,
          //   text: ns.text ?? null,
          //   type: ns.type,
          // });
          // break;
          const current = lo.toObject() as Shape;
          console.log("current:", current);

          const ns = updater(current);

          // Build a shallow patch for any changed flat key
          const patch: Record<string, any> = {};
          for (const k of Object.keys(ns)) {
            if (k === "id") continue;
            // only write if changed to reduce churn
            if ((current as any)[k] !== (ns as any)[k]) {
              (patch as any)[k] = (ns as any)[k];
            }
          }
          if (Object.keys(patch).length > 0) lo.update(patch);
          break;
        }
      }
    },
    []
  );

  const updateMany = useMutation(
    ({ storage }, ids: string[], updater: (s: Shape) => Shape) => {
      const list = storage.get("shapes") as LiveList<LiveObject<any>>;
      const set = new Set(ids);
      for (let i = 0; i < list.length; i++) {
        const lo = list.get(i)!;
        const s = fromLiveShape(lo);
        if (set.has(s.id)) {
          const ns = updater(s);
          lo.update({
            x: ns.x,
            y: ns.y,
            width: ns.width,
            height: ns.height,
          });
        }
      }
    },
    []
  );

  const removeShapes = useMutation(({ storage }, ids: string[]) => {
    const list = storage.get("shapes") as LiveList<LiveObject<any>>;
    const set = new Set(ids);
    // remove from end to keep indices stable
    for (let i = list.length - 1; i >= 0; i--) {
      const lo = list.get(i)!;
      if (set.has(lo.get("id"))) {
        list.delete(i);
      }
    }
  }, []);

  return {
    shapes,
    addShape,
    updateShape,
    updateMany,
    removeShapes,
    liveShapesReady: !!liveShapes,
  };
}
