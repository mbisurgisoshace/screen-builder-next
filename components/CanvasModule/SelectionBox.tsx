// components/SelectionGroup.tsx
import React from "react";

interface SelectionGroupProps {
  bounds: { x: number; y: number; w: number; h: number };
  onMouseDown?: (e: React.MouseEvent) => void;
}

export default function SelectionGroup({
  bounds,
  onMouseDown,
}: SelectionGroupProps) {
  return (
    <div
      data-groupdrag="true"
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        left: `${bounds.x - 4}px`,
        top: `${bounds.y - 4}px`,
        width: `${bounds.w + 8}px`,
        height: `${bounds.h + 8}px`,
        border: "2px solid #60A5FA",
        borderRadius: "4px",
        pointerEvents: "auto",
        zIndex: 50,
        background: "transparent",
      }}
    />
  );
}
