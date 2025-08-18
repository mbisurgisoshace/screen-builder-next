// components/CanvasModule/ui/toolbarExtrasStore.ts
"use client";

import { create } from "zustand";
import React, { useEffect, useMemo } from "react";

export type ExtrasNode = React.ReactNode | null;

type State = {
  map: Record<string, ExtrasNode>; // shapeId -> toolbar node
  set: (shapeId: string, node: ExtrasNode) => void;
  clear: (shapeId: string) => void;
};

export const toolbarExtrasStore = create<State>((set) => ({
  map: {},
  set: (shapeId, node) =>
    set((s) => ({ map: { ...s.map, [shapeId]: node ?? null } })),
  clear: (shapeId) =>
    set((s) => {
      const { [shapeId]: _omit, ...rest } = s.map;
      return { map: rest };
    }),
}));

// Selector used by ShapeFrame
export function useExtrasNode(shapeId: string): ExtrasNode {
  return toolbarExtrasStore((s) => s.map[shapeId] ?? null);
}

/**
 * Register block-specific toolbar content for a given shape.
 * Pass EVERY value the toolbar depends on in `deps` so it re-renders immediately.
 */
export function useRegisterToolbarExtras(
  shapeId: string,
  render: () => React.ReactNode,
  deps: any[]
) {
  const node = useMemo(render, deps);

  useEffect(() => {
    const { set, clear } = toolbarExtrasStore.getState();
    set(shapeId, node); // update toolbar for this shape id
    return () => clear(shapeId); // cleanup on unmount / id change
  }, [shapeId, node]);
}
