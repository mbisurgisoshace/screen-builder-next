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
import { useRegisterToolbarExtras } from "../toolbar/toolbarExtrasStore";

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
  selectedChildIds?: string[];
};

/** Config: include screen edges/centers for snapping/guides */
const INCLUDE_SCREEN_EDGES = true;
const INCLUDE_SCREEN_CENTERS = true;

export type ScreenPreset = {
  id: string;
  label: string;
  width: number;
  height: number;
  platform: "web" | "mobile" | "tablet";
};

export const SCREEN_PRESETS: ScreenPreset[] = [
  {
    id: "desktop",
    label: "Desktop (1440×900)",
    width: 1440,
    height: 900,
    platform: "web",
  },
  {
    id: "tablet",
    label: "Tablet (768×1024)",
    width: 768,
    height: 1024,
    platform: "tablet",
  },
  {
    id: "mobile",
    label: "Mobile (390×844)",
    width: 390,
    height: 844,
    platform: "mobile",
  },
];

const PALETTE = [
  "#ffffff",
  "#f8fafc",
  "#fee2e2",
  "#ffedd5",
  "#fef3c7",
  "#dcfce7",
  "#dbeafe",
  "#e9d5ff",
  "#fce7f3",
  "#000000",
  "#F2F4FE",
];

export const Screen: React.FC<
  { shape: IShape } & Omit<ShapeFrameProps, "shape" | "children"> &
    ChildSelectionProps
> = ({
  shape,
  scale = 1,
  canvasEl,
  position,
  isSelected,
  onMouseDown,
  onResizeStart,
  onCommitStyle,
  selectedCount,
  isChildSelected,
  onChildMouseDown,
  selectedChildIds = [],
}) => {
  const { updateChild } = useScreenChildren();
  const children = shape.children ?? [];
  const wrapRef = React.useRef<HTMLDivElement>(null);

  const [openPicker, setOpenPicker] = useState<
    null | "bg" | "fg" | "size" | "fs"
  >(null);

  // drag + resize state (local to this screen)
  const dragRef = useRef<ChildDragState>(null);
  const resizeRef = useRef<ChildResizeState>(null);
  const startLocalRef = useRef<{ x: number; y: number } | null>(null);
  const [isResizingChild, setIsResizingChild] = useState(false);

  const childSelectedCount = useMemo(() => {
    let n = 0;
    for (const c of children) {
      if (isChildSelected?.(shape.id, c.id)) n++;
    }
    return n;
  }, [children, isChildSelected, shape.id]);

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
      const L = x;
      const R = x + w;

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
      const T = y;
      const B = y + h;

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

      if ((e as any).detail >= 2) {
        e.preventDefault();
        e.stopPropagation();
        onChildMouseDown?.(e, shape.id, child.id); // ensure child becomes selected
        return;
      }

      e.stopPropagation();
      onChildMouseDown?.(e, shape.id, child.id);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      const world = clientToWorldFast(e.clientX, e.clientY);
      startLocalRef.current = { x: world.x - shape.x, y: world.y - shape.y };

      // Resolve which children are selected in THIS screen
      const selectedInThisScreen = getSelectedChildIdsForThisScreen(
        shape.id,
        children,
        isChildSelected
      );

      const ids =
        selectedInThisScreen.length > 0 &&
        selectedInThisScreen.includes(child.id)
          ? selectedInThisScreen
          : [child.id];

      const init: Record<string, { x: number; y: number }> = {};
      for (const id of ids) {
        const c = children.find((cc) => cc.id === id);
        if (c) init[id] = { x: c.x, y: c.y };
      }

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

      const prop = { x: st.init.x, y: st.init.y, w: st.init.w, h: st.init.h };
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

  function getSelectedChildIdsForThisScreen(
    screenId: string,
    children: IShape[],
    isChildSelected?: (screenId: string, childId: string) => boolean
  ) {
    return children
      .filter((c) => isChildSelected?.(screenId, c.id))
      .map((c) => c.id);
  }

  const presetLabel =
    shape.width >= 1200 ? "Desktop" : shape.width >= 700 ? "Tablet" : "Mobile";

  useRegisterToolbarExtras(
    shape.id,
    () => (
      <>
        <div ref={wrapRef} className="flex items-center gap-2 z-100">
          {/* BG */}
          <div className="relative">
            <button
              className="px-2 py-1 rounded bg-gray-100 border flex items-center gap-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpenPicker(openPicker === "bg" ? null : "bg");
              }}
            >
              <span className="text-gray-500">BG</span>
              <span
                className="w-4 h-4 rounded border"
                style={{
                  backgroundColor: shape.color || "#ffffff",
                }}
              />
            </button>
            {openPicker === "bg" && (
              <PalettePopover
                onPick={(c) => {
                  onCommitStyle?.(shape.id, { color: c });
                  setOpenPicker(null);
                }}
              />
            )}
          </div>

          {/* Screen size */}
          <div className="relative">
            <button
              className="px-2 h-[26px] rounded bg-gray-100 border flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                setOpenPicker(openPicker === "fs" ? null : "fs");
              }}
            >
              <span className="text-gray-500">Size</span>
              <span className="min-w-[5rem] px-1 py-0.5 rounded border bg-white text-xs text-gray-700 grid place-items-center">
                {presetLabel}
              </span>
            </button>

            {openPicker === "fs" && (
              <div
                className="absolute z-50 mt-1 w-[180px] rounded-md border bg-white shadow-lg"
                onClick={(e) => e.stopPropagation()} // keep dropdown open when clicking inside
              >
                <div className="max-h-[600px] overflow-auto py-1">
                  {SCREEN_PRESETS.map((s) => (
                    <button
                      key={s.id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
                      onClick={() => {
                        onCommitStyle?.(shape.id, {
                          width: s.width,
                          height: s.height,
                        });
                        setOpenPicker(null);
                      }}
                    >
                      <span>{s.label}</span>
                      {/* <span
                              className={
                                s === (shape.textSize ?? 14)
                                  ? "i-checked text-gray-700"
                                  : "opacity-0"
                              }
                            >
                              ✓
                            </span> */}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    ),
    [
      shape.id,
      shape.color,
      openPicker,
      shape.textColor,
      shape.textStyle,
      shape.textSize,
      onCommitStyle,
    ]
  );

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
          //overflow: "hidden", // keep children clipped by screen
          boxShadow: "0 0 0 1px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.06)",
        }}
      >
        {/* Top bar label */}
        <div
          className="absolute left-2 -top-7 text-xs px-1.5 py-0.5 rounded bg-black/70 text-white"
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
            const multi = childSelectedCount > 1;

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
                  isSelected={selected}
                  //resizable={true}
                  //selectedCount={1}
                  //@ts-ignore
                  onMouseDown={(e) => onChildPointerDown(e, child)}
                  onResizeStart={(evt, _id, handle) =>
                    //@ts-ignore
                    onChildResizeStart(evt, child, handle)
                  }
                  //selectedCount={selectedCount}
                  selectedCount={selected ? 1 : 0}
                  //selectedCount={childSelectedCount}
                  //@ts-ignore
                  onCommitStyle={(_id, patch) =>
                    updateChild(shape.id, child.id, (c) => ({ ...c, ...patch }))
                  }
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

function PalettePopover({
  onPick,
  selectedHex,
}: {
  onPick: (c: string) => void;
  selectedHex?: string;
}) {
  return (
    <div
      className="absolute w-max top-full left-0 mt-1 z-50 p-2 bg-white border rounded-xl shadow grid grid-cols-5 gap-1"
      data-nodrag="true"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {PALETTE.map((c) => (
        <button
          key={c}
          title={c}
          className={`w-6 h-6 rounded border hover:scale-105 transition ${
            selectedHex === c ? "ring-2 ring-blue-500" : ""
          }`}
          style={{ backgroundColor: c }}
          onClick={(e) => {
            e.stopPropagation();
            onPick(c);
          }}
        />
      ))}
    </div>
  );
}
