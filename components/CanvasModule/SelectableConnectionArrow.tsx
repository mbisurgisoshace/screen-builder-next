"use client";
import React from "react";

type Pt = { x: number; y: number };

export interface SelectableConnectionArrowProps {
  id: string;
  from: Pt; // world coords
  to: Pt; // world coords
  selected?: boolean;
  onSelect?: (id: string) => void;
  color?: string;
  strokeWidth?: number;
  zIndex?: number;
}

export const SelectableConnectionArrow: React.FC<
  SelectableConnectionArrowProps
> = ({
  id,
  from,
  to,
  selected = false,
  onSelect,
  color = "#3B82F6",
  strokeWidth = 2,
  zIndex = 20,
}) => {
  // bbox with padding so curves/arrowhead won’t clip
  const pad = 40;
  const minX = Math.min(from.x, to.x) - pad;
  const minY = Math.min(from.y, to.y) - pad;
  const maxX = Math.max(from.x, to.x) + pad;
  const maxY = Math.max(from.y, to.y) + pad;
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  // local coords
  const fx = from.x - minX;
  const fy = from.y - minY;
  const tx = to.x - minX;
  const ty = to.y - minY;

  // simple cubic curve (same as preview)
  const dx = tx - fx;
  const curveFactor = 0.3;
  const cp1 = { x: fx + dx * curveFactor, y: fy };
  const cp2 = { x: tx - dx * curveFactor, y: ty };
  const d = `M ${fx},${fy} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${tx},${ty}`;

  // unique marker id to avoid collisions
  const markerId = `arrowhead-${id}`;

  return (
    <svg
      className="absolute"
      style={{
        left: `${minX}px`,
        top: `${minY}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex,
      }}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={selected ? "#2563EB" : color}
          />
        </marker>
      </defs>

      {/* wide hit area for easy selection */}
      <path
        d={d}
        stroke="transparent"
        strokeWidth={16}
        fill="none"
        style={{ cursor: "pointer" }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onSelect?.(id);
        }}
      />

      {/* visible path */}
      <path
        d={d}
        stroke={selected ? "#2563EB" : color}
        strokeWidth={selected ? strokeWidth + 1 : strokeWidth}
        fill="none"
        markerEnd={`url(#${markerId})`}
        pointerEvents="none"
      />
    </svg>
  );
};
