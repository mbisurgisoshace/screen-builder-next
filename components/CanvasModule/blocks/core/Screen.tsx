"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useStorage } from "@liveblocks/react";
import { v4 as uuidv4 } from "uuid";
import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";
import { ScreenFrame } from "../ScreenFrame";
import { shapeRegistry } from "../blockRegistry";
import { useScreenChildren } from "../../hooks/realtime/useRealtimeShapes";

type ChildDragState = null | {
  id: string;
  initX: number;
  initY: number;
};

type ChildResizeState = null | {
  id: string;
  handle: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
  startLocal: { x: number; y: number };
  init: { x: number; y: number; w: number; h: number };
};

/** Visual guide line within the screen (local coords) */
type GuideLine =
  | { type: "v"; x: number; fromY: number; toY: number }
  | { type: "h"; y: number; fromX: number; toX: number };

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

type ChildSelectionProps = {
  onChildMouseDown?: (
    e: React.PointerEvent,
    screenId: string,
    childId: string
  ) => void;
  isChildSelected?: (screenId: string, childId: string) => boolean;
};

/** Config: include screen edges/centers for snapping/guides */
const INCLUDE_SCREEN_EDGES = true;
const INCLUDE_SCREEN_CENTERS = true;

export const Screen: React.FC<
  { shape: IShape } & Omit<ShapeFrameProps, "shape" | "children"> &
    ChildSelectionProps
> = ({
  shape,
  scale = 1,
  canvasEl,
  position,
  isSelected,
  selectedCount,
  onMouseDown,
  onResizeStart,
  onChildMouseDown,
  isChildSelected,
}) => {
  const { updateChild } = useScreenChildren();
  const children = shape.children ?? [];

  // drag + resize state (local to this screen)
  const dragRef = useRef<ChildDragState>(null);
  const resizeRef = useRef<ChildResizeState>(null);
  const startLocalRef = useRef<{ x: number; y: number } | null>(null);
  const [isResizingChild, setIsResizingChild] = useState(false);

  // Smart guides state (rendered only during active drag/resize)
  const [guides, setGuides] = useState<GuideLine[]>([]);

  // Convert client pointer to world coords using the inner transformed element
  const clientToWorldFast = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasEl) return { x: clientX, y: clientY };
      const r = canvasEl.getBoundingClientRect();
      return {
        x: (clientX - r.left) / scale,
        y: (clientY - r.top) / scale,
      };
    },
    [canvasEl, scale]
  );

  /** Snap tolerance in world units ≈ 6px on screen */
  const SNAP_TOL = useMemo(() => 6 / (scale || 1), [scale]);

  /**
   * Build snap candidates (in local screen coords):
   * - screen edges (0 / width, 0 / height)
   * - screen centers (width/2, height/2) — optional
   * - siblings’ edges and centers (excluding the active child)
   */
  const buildSnapSets = useCallback(
    (activeId: string) => {
      const xs: number[] = [];
      const ys: number[] = [];

      if (INCLUDE_SCREEN_EDGES) {
        xs.push(0, shape.width);
        ys.push(0, shape.height);
      }
      if (INCLUDE_SCREEN_CENTERS) {
        xs.push(shape.width / 2);
        ys.push(shape.height / 2);
      }

      for (const c of children) {
        if (c.id === activeId) continue;
        xs.push(c.x, c.x + c.width / 2, c.x + c.width);
        ys.push(c.y, c.y + c.height / 2, c.y + c.height);
      }

      return {
        xs: Array.from(new Set(xs)).sort((a, b) => a - b),
        ys: Array.from(new Set(ys)).sort((a, b) => a - b),
      };
    },
    [children, shape.width, shape.height]
  );

  /** Helper to pick nearest candidate within tolerance; returns snapped value + guide lines */
  function snapPosition(
    proposedLeft: number,
    proposedTop: number,
    width: number,
    height: number,
    snaps: { xs: number[]; ys: number[] },
    tol: number
  ) {
    let x = proposedLeft;
    let y = proposedTop;
    const gx: GuideLine[] = [];
    const gy: GuideLine[] = [];

    // Our element edges/centers (proposed)
    const L = proposedLeft;
    const CX = proposedLeft + width / 2;
    const R = proposedLeft + width;

    const T = proposedTop;
    const CY = proposedTop + height / 2;
    const B = proposedTop + height;

    // Try snapping each of the 3 x positions to candidates
    const testX = [
      { kind: "L", val: L, apply: (snap: number) => (x += snap - L) },
      { kind: "CX", val: CX, apply: (snap: number) => (x += snap - CX) },
      { kind: "R", val: R, apply: (snap: number) => (x += snap - R) },
    ] as const;

    // same for y
    const testY = [
      { kind: "T", val: T, apply: (snap: number) => (y += snap - T) },
      { kind: "CY", val: CY, apply: (snap: number) => (y += snap - CY) },
      { kind: "B", val: B, apply: (snap: number) => (y += snap - B) },
    ] as const;

    // find best X snap
    let bestX: {
      delta: number;
      to: number;
      kind: (typeof testX)[number]["kind"];
    } | null = null;
    for (const probe of testX) {
      for (const cand of snaps.xs) {
        const d = Math.abs(cand - probe.val);
        if (d <= tol && (!bestX || d < bestX.delta)) {
          bestX = { delta: d, to: cand, kind: probe.kind };
        }
      }
    }
    if (bestX) {
      const beforeX = x;
      const chosen = testX.find((t) => t.kind === bestX!.kind)!;
      chosen.apply(bestX.to);
      // vertical guide line at snapped x
      gx.push({
        type: "v",
        x: bestX.to,
        fromY: 0,
        toY: shape.height,
      });
      // ensure x moved (avoid floating errors)
      if (Math.abs(beforeX - x) < 1e-6)
        x =
          bestX.to -
          (bestX.kind === "R" ? width : bestX.kind === "CX" ? width / 2 : 0);
    }

    // find best Y snap
    let bestY: {
      delta: number;
      to: number;
      kind: (typeof testY)[number]["kind"];
    } | null = null;
    for (const probe of testY) {
      for (const cand of snaps.ys) {
        const d = Math.abs(cand - probe.val);
        if (d <= tol && (!bestY || d < bestY.delta)) {
          bestY = { delta: d, to: cand, kind: probe.kind };
        }
      }
    }
    if (bestY) {
      const beforeY = y;
      const chosen = testY.find((t) => t.kind === bestY!.kind)!;
      chosen.apply(bestY.to);
      gy.push({
        type: "h",
        y: bestY.to,
        fromX: 0,
        toX: shape.width,
      });
      if (Math.abs(beforeY - y) < 1e-6)
        y =
          bestY.to -
          (bestY.kind === "B" ? height : bestY.kind === "CY" ? height / 2 : 0);
    }

    return { x, y, guideLines: [...gx, ...gy] as GuideLine[] };
  }

  /**
   * Resize snapping: given the handle, we only snap the edges that are "active".
   * This returns new x/y/w/h and guide lines (only for the snapped edges).
   */
  function snapResize(
    init: { x: number; y: number; w: number; h: number },
    proposal: { x: number; y: number; w: number; h: number },
    handle: ResizeHandle,
    snaps: { xs: number[]; ys: number[] },
    tol: number
  ) {
    let { x, y, w, h } = proposal;
    const lines: GuideLine[] = [];

    // active edges for this handle
    const affectsLeft = handle.includes("w");
    const affectsRight = handle.includes("e");
    const affectsTop = handle.includes("n");
    const affectsBottom = handle.includes("s");

    // try snapping left/right
    if (affectsLeft || affectsRight) {
      const candidates = snaps.xs;
      // compute proposed edges
      let L = x;
      let R = x + w;

      let bestForL: { d: number; to: number } | null = null;
      let bestForR: { d: number; to: number } | null = null;

      if (affectsLeft) {
        for (const c of candidates) {
          const d = Math.abs(c - L);
          if (d <= tol && (!bestForL || d < bestForL.d))
            bestForL = { d, to: c };
        }
      }
      if (affectsRight) {
        for (const c of candidates) {
          const d = Math.abs(c - R);
          if (d <= tol && (!bestForR || d < bestForR.d))
            bestForR = { d, to: c };
        }
      }

      // apply best snaps, favor the smaller delta if both present
      if (bestForL && (!bestForR || bestForL.d <= bestForR.d)) {
        const delta = bestForL.to - L;
        x += delta;
        w -= delta;
        lines.push({ type: "v", x: bestForL.to, fromY: 0, toY: shape.height });
      } else if (bestForR) {
        const delta = bestForR.to - R;
        w += delta;
        lines.push({ type: "v", x: bestForR.to, fromY: 0, toY: shape.height });
      }
    }

    // try snapping top/bottom
    if (affectsTop || affectsBottom) {
      const candidates = snaps.ys;
      let T = y;
      let B = y + h;

      let bestForT: { d: number; to: number } | null = null;
      let bestForB: { d: number; to: number } | null = null;

      if (affectsTop) {
        for (const c of candidates) {
          const d = Math.abs(c - T);
          if (d <= tol && (!bestForT || d < bestForT.d))
            bestForT = { d, to: c };
        }
      }
      if (affectsBottom) {
        for (const c of candidates) {
          const d = Math.abs(c - B);
          if (d <= tol && (!bestForB || d < bestForB.d))
            bestForB = { d, to: c };
        }
      }

      if (bestForT && (!bestForB || bestForT.d <= bestForB.d)) {
        const delta = bestForT.to - T;
        y += delta;
        h -= delta;
        lines.push({ type: "h", y: bestForT.to, fromX: 0, toX: shape.width });
      } else if (bestForB) {
        const delta = bestForB.to - B;
        h += delta;
        lines.push({ type: "h", y: bestForB.to, fromX: 0, toX: shape.width });
      }
    }

    return { x, y, w, h, guideLines: lines };
  }

  // --- Child dragging (ignore if the event started on a resize handle) ---
  const onChildPointerDown = useCallback(
    (e: React.PointerEvent, child: IShape) => {
      // If this pointerdown originated from a resize handle inside ShapeFrame,
      // skip starting a drag (the handle's mousedown will kick off resizing).
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.getAttribute("data-handle") || target.closest("[data-handle]"))
      ) {
        return;
      }

      e.stopPropagation();
      onChildMouseDown?.(e, shape.id, child.id);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      const world = clientToWorldFast(e.clientX, e.clientY);
      startLocalRef.current = { x: world.x - shape.x, y: world.y - shape.y };

      dragRef.current = {
        id: child.id,
        initX: child.x,
        initY: child.y,
      };

      setGuides([]); // clear any stale guides
    },
    [onChildMouseDown, shape.id, clientToWorldFast]
  );

  // --- Child resizing (start) ---
  const onChildResizeStart = useCallback(
    (
      e: React.MouseEvent<HTMLDivElement>,
      child: IShape,
      handle: NonNullable<ChildResizeState>["handle"]
    ) => {
      e.preventDefault();
      e.stopPropagation();

      const world = clientToWorldFast(e.clientX, e.clientY);
      const startLocal = { x: world.x - shape.x, y: world.y - shape.y };
      resizeRef.current = {
        id: child.id,
        handle,
        startLocal,
        init: { x: child.x, y: child.y, w: child.width, h: child.height },
      };
      setIsResizingChild(true); // activate window listeners
      setGuides([]);
    },
    [clientToWorldFast, shape.x, shape.y]
  );

  // Window-level listeners while resizing (so mouseup outside still ends it)
  useEffect(() => {
    if (!isResizingChild) return;

    const onMove = (e: MouseEvent) => {
      const st = resizeRef.current;
      if (!st) return;

      const world = clientToWorldFast(e.clientX, e.clientY);
      const cur = { x: world.x - shape.x, y: world.y - shape.y };
      const dx = cur.x - st.startLocal.x;
      const dy = cur.y - st.startLocal.y;

      let prop = { x: st.init.x, y: st.init.y, w: st.init.w, h: st.init.h };
      const MIN_W = 24;
      const MIN_H = 16;

      switch (st.handle) {
        case "n":
          prop.y = st.init.y + dy;
          prop.h = st.init.h - dy;
          break;
        case "s":
          prop.h = st.init.h + dy;
          break;
        case "w":
          prop.x = st.init.x + dx;
          prop.w = st.init.w - dx;
          break;
        case "e":
          prop.w = st.init.w + dx;
          break;
        case "nw":
          prop.x = st.init.x + dx;
          prop.w = st.init.w - dx;
          prop.y = st.init.y + dy;
          prop.h = st.init.h - dy;
          break;
        case "ne":
          prop.y = st.init.y + dy;
          prop.h = st.init.h - dy;
          prop.w = st.init.w + dx;
          break;
        case "sw":
          prop.x = st.init.x + dx;
          prop.w = st.init.w - dx;
          prop.h = st.init.h + dy;
          break;
        case "se":
          prop.w = st.init.w + dx;
          prop.h = st.init.h + dy;
          break;
      }

      // Min size
      prop.w = Math.max(MIN_W, prop.w);
      prop.h = Math.max(MIN_H, prop.h);

      // Clamp inside screen
      prop.x = Math.min(Math.max(prop.x, 0), Math.max(0, shape.width - prop.w));
      prop.y = Math.min(
        Math.max(prop.y, 0),
        Math.max(0, shape.height - prop.h)
      );

      // Snap relevant edges for this handle
      const snaps = buildSnapSets(st.id);
      const snapped = snapResize(st.init, prop, st.handle, snaps, SNAP_TOL);

      // Apply & show guides
      updateChild(shape.id, st.id, (c) => ({
        ...c,
        x: snapped.x,
        y: snapped.y,
        width: snapped.w,
        height: snapped.h,
      }));
      setGuides(snapped.guideLines);
    };

    const onUp = () => {
      resizeRef.current = null;
      startLocalRef.current = null;
      setIsResizingChild(false);
      setGuides([]);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [
    isResizingChild,
    clientToWorldFast,
    shape.x,
    shape.y,
    shape.width,
    shape.height,
    updateChild,
    buildSnapSets,
    SNAP_TOL,
  ]);

  // Drag move (only when not resizing)
  const onChildPointerMove = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      if (resizeRef.current) return; // resizing takes priority
      if (!dragRef.current || !startLocalRef.current) return;

      const { id, initX, initY } = dragRef.current;
      const world = clientToWorldFast(e.clientX, e.clientY);
      const currLocal = { x: world.x - shape.x, y: world.y - shape.y };
      const dx = currLocal.x - startLocalRef.current.x;
      const dy = currLocal.y - startLocalRef.current.y;

      // proposed new position
      let px = initX + dx;
      let py = initY + dy;

      // clamp inside screen using current child size
      const child = children.find((c) => c.id === id);
      if (!child) return;
      const cw = child.width;
      const ch = child.height;

      px = Math.min(Math.max(px, 0), Math.max(0, shape.width - cw));
      py = Math.min(Math.max(py, 0), Math.max(0, shape.height - ch));

      // Snap (to screen + siblings)
      const snaps = buildSnapSets(id);
      const snapped = snapPosition(px, py, cw, ch, snaps, SNAP_TOL);

      updateChild(shape.id, id, (c) => ({ ...c, x: snapped.x, y: snapped.y }));
      setGuides(snapped.guideLines);
    },
    [
      children,
      clientToWorldFast,
      shape.id,
      shape.width,
      shape.height,
      shape.x,
      shape.y,
      updateChild,
      buildSnapSets,
      SNAP_TOL,
    ]
  );

  const onChildPointerUp = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    dragRef.current = null;
    setGuides([]);
    // Note: resize end is handled on window mouseup to catch outside releases
  }, []);

  const presetLabel =
    shape.screenPreset ??
    (shape.width >= 1200
      ? "Desktop"
      : shape.width >= 700
      ? "Tablet"
      : "Mobile");

  return (
    <ScreenFrame
      shape={shape}
      isSelected={isSelected}
      selectedCount={selectedCount}
      onMouseDown={onMouseDown}
      onResizeStart={onResizeStart}
      showConnectors={false}
      resizable={false}
    >
      <div
        data-shape-id={shape.id}
        data-shape-type="screen"
        className="w-full h-full relative border rounded-md bg-white"
        style={{
          background: shape.color || "#ffffff",
          overflow: "hidden", // keep children clipped by screen
          boxShadow: "0 0 0 1px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.06)",
        }}
      >
        {/* Top bar label */}
        <div
          className="absolute left-2 top-2 text-xs px-1.5 py-0.5 rounded bg-black/70 text-white"
          style={{ pointerEvents: "none" }}
        >
          {presetLabel} · {Math.round(shape.width)}×{Math.round(shape.height)}
        </div>

        {/* Optional dot grid */}
        <svg
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <defs>
            <pattern
              id="scr-grid"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="0.5" fill="rgba(0,0,0,0.08)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#scr-grid)" />
        </svg>

        {/* Children: render with local absolute coordinates */}
        <div className="absolute inset-0">
          {children.map((child) => {
            const Block = shapeRegistry[child.type];
            if (!Block) return null;
            const selected = isChildSelected?.(shape.id, child.id) ?? false;
            return (
              <div
                key={child.id}
                className="absolute"
                style={{
                  left: `${child.x}px`,
                  top: `${child.y}px`,
                  width: `${child.width}px`,
                  height: `${child.height}px`,
                }}
                onPointerDown={(e) => onChildPointerDown(e, child)}
                onPointerMove={onChildPointerMove}
                onPointerUp={onChildPointerUp}
              >
                <Block
                  shape={child}
                  positioned={false}
                  //resizable={true}
                  isSelected={selected}
                  onMouseDown={(e) => onChildPointerDown(e, child)}
                  onResizeStart={(evt, _id, handle) =>
                    onChildResizeStart(evt, child, handle)
                  }
                  selectedCount={selectedCount}
                />
              </div>
            );
          })}

          {/* Smart Guides */}
          {guides.map((g, i) =>
            g.type === "v" ? (
              <div
                key={`vg-${i}`}
                className="absolute pointer-events-none"
                style={{
                  left: `${g.x}px`,
                  top: `${Math.min(g.fromY, g.toY)}px`,
                  width: 0,
                  height: `${Math.abs(g.toY - g.fromY)}px`,
                  borderLeft: "1px dashed #60A5FA",
                  zIndex: 250,
                }}
              />
            ) : (
              <div
                key={`hg-${i}`}
                className="absolute pointer-events-none"
                style={{
                  top: `${g.y}px`,
                  left: `${Math.min(g.fromX, g.toX)}px`,
                  height: 0,
                  width: `${Math.abs(g.toX - g.fromX)}px`,
                  borderTop: "1px dashed #60A5FA",
                  zIndex: 250,
                }}
              />
            )
          )}
        </div>
      </div>
    </ScreenFrame>
  );
};
