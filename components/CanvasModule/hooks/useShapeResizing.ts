// CanvasModule/hooks/useShapeResizing.ts
import { useEffect } from "react";
import { useHistory } from "@liveblocks/react";

import { Position, Shape } from "../types";
import { snapWidthToGridColumns } from "../utils/gridColumns"; // 👈 NEW

interface UseShapeResizingProps {
  scale: number;
  shapes: Shape[];
  setResizing: (value: null) => void;
  lastMousePos: Position;
  resizing: { id: string; handle: string } | null;
  setLastMousePos: (pos: Position) => void;
  updateShape: (id: string, updater: (s: Shape) => Shape) => void;
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
}

export const useShapeResizing = ({
  resizing,
  setResizing,
  shapes,
  setShapes,
  scale,
  updateShape,
  lastMousePos,
  setLastMousePos,
}: UseShapeResizingProps) => {
  const { pause, resume } = useHistory();

  useEffect(() => {
    if (!resizing) return;

    pause();
    let didPause = true;

    // 👇 Get the active screen and its grid config (same assumption as dragging)
    const screen = shapes.find((s: any) => (s as any).type === "screen") as any;
    const grid = screen?.gridColumns;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - lastMousePos.x) / scale;
      const dy = (e.clientY - lastMousePos.y) / scale;

      updateShape(resizing.id, (shape) => {
        let { x, y, width, height } = shape;

        // --- base resize behavior (unchanged) ---
        if (resizing.handle.includes("e")) width = Math.max(20, width + dx);
        if (resizing.handle.includes("s")) height = Math.max(20, height + dy);
        if (resizing.handle.includes("w")) {
          x += dx;
          width = Math.max(20, width - dx);
        }
        if (resizing.handle.includes("n")) {
          y += dy;
          height = Math.max(20, height - dy);
        }

        // --- NEW: snap right edge to grid columns when dragging east handle ---
        if (
          grid?.enabled &&
          grid.snapToColumns &&
          resizing.handle.includes("e") &&
          screen
        ) {
          // x is the left edge (unchanged for "e" handle)
          const localX = x - (screen.x ?? 0);

          const snappedWidth = snapWidthToGridColumns(
            localX,
            width,
            screen.width,
            grid
          );

          width = Math.max(20, snappedWidth);
        }

        return { ...shape, x, y, width, height };
      });

      setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setResizing(null);

      if (didPause) {
        resume();
        didPause = false;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    resizing,
    lastMousePos,
    scale,
    shapes,
    setResizing,
    setLastMousePos,
    updateShape,
    pause,
    resume,
  ]);
};
