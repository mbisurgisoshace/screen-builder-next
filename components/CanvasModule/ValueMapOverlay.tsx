// components/canvas/ValueMapOverlay.tsx
"use client";
import * as React from "react";

type Props = {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  position: { x: number; y: number };
  scale: number;
  visible: boolean;
  zIndex?: number; // draw under shapes by default
};

const SECTIONS = [
  { key: "jobs", label: "Jobs to be done", col: 0, row: 0 },
  { key: "products", label: "Products & services", col: 1, row: 0 },
  { key: "pains", label: "Pains", col: 0, row: 1 },
  { key: "relievers", label: "Pain relievers", col: 1, row: 1 },
  { key: "gains", label: "Gains", col: 0, row: 2 },
  { key: "creators", label: "Gain creators", col: 1, row: 2 },
];

export function ValueMapOverlay({
  canvasRef,
  position,
  scale,
  visible,
  zIndex = 1,
}: Props) {
  if (!visible || !canvasRef.current) return null;

  // Visible viewport in **world** units
  const vw = canvasRef.current.clientWidth / scale;
  const vh = canvasRef.current.clientHeight / scale;
  const vx = -position.x / scale; // top-left (world)
  const vy = -position.y / scale;

  const colW = vw / 2;
  const rowH = vh / 3;

  // Keep strokes & text ~constant in screen pixels
  const px = 1 / Math.max(scale, 0.001);
  const font = 12 / Math.max(scale, 0.001);

  return (
    <div
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex }}
    >
      {SECTIONS.map((s) => {
        const left = vx + s.col * colW;
        const top = vy + s.row * rowH;
        return (
          <div
            key={s.key}
            className="absolute  flex items-center justify-center"
            style={{
              left,
              top,
              width: colW,
              height: rowH,
              border: `${px}px dashed rgba(59,130,246,0.55)`,
              background: "transparent",
            }}
          >
            <div
              className="rounded-full"
              style={{
                top: 8 / scale,
                left: 8 / scale,
                padding: `${2 / scale}px ${6 / scale}px`,
                fontSize: font,
                lineHeight: 1,
                background: "rgba(255,255,255,0.9)",
                color: "#111827",
                border: `${px}px solid rgba(0,0,0,0.06)`,
                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                whiteSpace: "nowrap",
              }}
            >
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
