// CanvasModule/hooks/useShapeResizing.ts
import { useEffect } from "react";

import { Position, Shape } from "../types";

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
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return;

      const dx = (e.clientX - lastMousePos.x) / scale;
      const dy = (e.clientY - lastMousePos.y) / scale;

      // setShapes((prevShapes) =>
      //   prevShapes.map((shape) => {
      //     if (shape.id !== resizing.id) return shape;
      //     let { x, y, width, height } = shape;

      //     if (resizing.handle.includes("e")) width = Math.max(20, width + dx);
      //     if (resizing.handle.includes("s")) height = Math.max(20, height + dy);
      //     if (resizing.handle.includes("w")) {
      //       x += dx;
      //       width = Math.max(20, width - dx);
      //     }
      //     if (resizing.handle.includes("n")) {
      //       y += dy;
      //       height = Math.max(20, height - dy);
      //     }

      //     return { ...shape, x, y, width, height };
      //   })
      // );
      updateShape(resizing.id, (shape) => {
        let { x, y, width, height } = shape;

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
        return { ...shape, x, y, width, height };
      });

      setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, lastMousePos, scale]);
};
