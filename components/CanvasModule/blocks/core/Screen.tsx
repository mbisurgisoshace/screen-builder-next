"use client";
import React, { useCallback, useMemo, useRef } from "react";
import { useStorage } from "@liveblocks/react";
import { v4 as uuidv4 } from "uuid";
import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";
import { ScreenFrame } from "../ScreenFrame";
import { shapeRegistry } from "../blockRegistry";
import { useScreenChildren } from "../../hooks/realtime/useRealtimeShapes";

type ChildDragState = null | {
  id: string;
  startX: number;
  startY: number;
  initX: number;
  initY: number;
};

export const Screen: React.FC<
  { shape: IShape } & Omit<ShapeFrameProps, "shape" | "children">
> = ({ shape, isSelected, selectedCount, onMouseDown, onResizeStart }) => {
  const { updateChild } = useScreenChildren();
  const children = shape.children ?? [];

  // simple in-component drag state for children
  const dragRef = useRef<ChildDragState>(null);

  const onChildPointerDown = useCallback(
    (e: React.PointerEvent, child: IShape) => {
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        id: child.id,
        startX: e.clientX,
        startY: e.clientY,
        initX: child.x,
        initY: child.y,
      };
    },
    []
  );

  const onChildPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const { id, startX, startY, initX, initY } = dragRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // clamp inside screen bounds (local coords)
      let nx = initX + dx;
      let ny = initY + dy;
      nx = Math.min(Math.max(nx, 0), Math.max(0, shape.width - 1));
      ny = Math.min(Math.max(ny, 0), Math.max(0, shape.height - 1));

      updateChild(shape.id, id, (c) => ({
        ...c,
        x: nx,
        y: ny,
      }));
    },
    [shape.id, shape.width, shape.height, updateChild]
  );

  const onChildPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    dragRef.current = null;
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
                <ShapeFrame
                  shape={child}
                  resizable={false}
                  showConnectors={false}
                  isSelected={false}
                  selectedCount={0}
                  onMouseDown={() => {}}
                  onResizeStart={() => {}}
                >
                  <Block
                    shape={child}
                    isSelected={false}
                    onMouseDown={() => {}}
                    onResizeStart={() => {}}
                    selectedCount={selectedCount}
                  />
                </ShapeFrame>
              </div>
            );
          })}
        </div>
      </div>
    </ScreenFrame>
  );
};
