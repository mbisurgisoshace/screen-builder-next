"use client";
import React, { useMemo } from "react";
import { useStorage } from "@liveblocks/react";
import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";
import { ScreenFrame } from "../ScreenFrame";
import { shapeRegistry } from "../blockRegistry";

export const Screen: React.FC<
  { shape: IShape } & Omit<ShapeFrameProps, "shape" | "children">
> = ({ shape, isSelected, selectedCount, onMouseDown, onResizeStart }) => {
  const presetLabel =
    shape.screenPreset ??
    (shape.width >= 1200
      ? "Desktop"
      : shape.width >= 700
      ? "Tablet"
      : "Mobile");

  const all = useStorage((r) => r.shapes) as IShape[];

  // Children: prefer explicit order (childrenIds), else fallback to parentId grouping
  const children = useMemo(() => {
    if (shape.childrenIds?.length) {
      const byId = new Map(all.map((s) => [s.id, s]));
      return shape.childrenIds
        .map((id) => byId.get(id))
        .filter(Boolean) as IShape[];
    }
    return all.filter((s) => s.parentId === shape.id);
  }, [all, shape.childrenIds, shape.id]);

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
          //overflow: shape.clipContents ? "hidden" : "visible",
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

        {/* Optional grid (simple 8px dot grid) */}
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

        {/* Children (rendered via ShapeFrame, localized visually) */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${-shape.x}px, ${-shape.y}px)`,
              willChange: "transform",
            }}
          >
            {children.map((child) => {
              const Block = shapeRegistry[child.type];
              if (!Block) return null;
              return (
                <Block
                  shape={child}
                  isSelected={isSelected}
                  key={child.id}
                  onMouseDown={() => {}}
                  onResizeStart={() => {}}
                  selectedCount={0}
                />
              );
            })}
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
};
