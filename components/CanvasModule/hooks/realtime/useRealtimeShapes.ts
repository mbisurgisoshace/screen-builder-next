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
    subtype: shape.subtype ?? null,
    cardTitle: shape.cardTitle ?? null,
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
    cardTitle: obj.get("cardTitle") ?? undefined,
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

      let shape: Shape = {
        id: nextId,
        type,
        x,
        y,
        width:
          type === "text"
            ? 120
            : type === "interview"
            ? 700
            : type === "question"
            ? 440
            : type === "question_answer"
            ? 1180
            : 160,
        height:
          type === "text"
            ? 40
            : type === "interview"
            ? 228
            : type === "question"
            ? 320
            : type === "question_answer"
            ? 320
            : 112,
        color: "#EAFBE3",
        cardTitle: "",
        text: type === "text" ? "New text" : undefined,
      };

      if (type === "table") {
        const rows = 3,
          cols = 3;
        shape = {
          ...shape,
          width: 360,
          height: 240,
          tableRows: rows,
          tableCols: cols,
          tableData: Array.from({ length: rows }, () =>
            Array.from({ length: cols }, () => "")
          ),
        };
      }

      if (type === "card") {
        shape = {
          ...shape,
          width: 440,
          height: 320,
          subtype: "select_subtype",
        };
      }

      if (type === "feature_idea") {
        shape = {
          ...shape,
          width: 780,
          height: 530,
        };
      }

      if (type === "question_answer") {
        shape = {
          ...shape,
          width: 800,
          height: 320,
        };
      }

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
