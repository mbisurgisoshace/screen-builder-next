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

type ChildSelectionProps = {
  onChildMouseDown?: (
    e: React.PointerEvent,
    screenId: string,
    childId: string
  ) => void;
  isChildSelected?: (screenId: string, childId: string) => boolean;
};

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

      let { x, y, w, h } = st.init;
      const MIN_W = 24;
      const MIN_H = 16;

      switch (st.handle) {
        case "n":
          y = st.init.y + dy;
          h = st.init.h - dy;
          break;
        case "s":
          h = st.init.h + dy;
          break;
        case "w":
          x = st.init.x + dx;
          w = st.init.w - dx;
          break;
        case "e":
          w = st.init.w + dx;
          break;
        case "nw":
          x = st.init.x + dx;
          w = st.init.w - dx;
          y = st.init.y + dy;
          h = st.init.h - dy;
          break;
        case "ne":
          y = st.init.y + dy;
          h = st.init.h - dy;
          w = st.init.w + dx;
          break;
        case "sw":
          x = st.init.x + dx;
          w = st.init.w - dx;
          h = st.init.h + dy;
          break;
        case "se":
          w = st.init.w + dx;
          h = st.init.h + dy;
          break;
      }

      // Min size
      w = Math.max(MIN_W, w);
      h = Math.max(MIN_H, h);

      // Clamp to screen bounds
      x = Math.min(Math.max(x, 0), Math.max(0, shape.width - w));
      y = Math.min(Math.max(y, 0), Math.max(0, shape.height - h));

      updateChild(shape.id, st.id, (c) => ({
        ...c,
        x,
        y,
        width: w,
        height: h,
      }));
    };

    const onUp = () => {
      resizeRef.current = null;
      startLocalRef.current = null;
      setIsResizingChild(false);
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

      let nx = initX + dx;
      let ny = initY + dy;

      const child = children.find((c) => c.id === id);
      const cw = child?.width ?? 1;
      const ch = child?.height ?? 1;

      nx = Math.min(Math.max(nx, 0), Math.max(0, shape.width - cw));
      ny = Math.min(Math.max(ny, 0), Math.max(0, shape.height - ch));

      updateChild(shape.id, id, (c) => ({ ...c, x: nx, y: ny }));
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
    ]
  );

  const onChildPointerUp = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    dragRef.current = null;
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
        </div>
      </div>
    </ScreenFrame>
  );
};
