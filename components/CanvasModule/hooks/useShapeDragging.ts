import { useEffect } from "react";
import { Position, Shape } from "../types";

interface UseShapeDraggingParams {
  scale: number;
  selectedShapeIds: number[];
  shapes: Shape[];
  setShapes: (shapes: Shape[] | ((prev: Shape[]) => Shape[])) => void;
  setDragging: (dragging: boolean) => void;
  dragging: boolean;
  lastMousePos: Position;
  setLastMousePos: (pos: Position) => void;
}

export function useShapeDragging({
  scale,
  selectedShapeIds,
  shapes,
  setShapes,
  setDragging,
  dragging,
  lastMousePos,
  setLastMousePos,
}: UseShapeDraggingParams) {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging && selectedShapeIds.length > 0) {
        const worldDX = (e.clientX - lastMousePos.x) / scale;
        const worldDY = (e.clientY - lastMousePos.y) / scale;
        setShapes((prev) =>
          prev.map((shape) =>
            selectedShapeIds.includes(shape.id)
              ? { ...shape, x: shape.x + worldDX, y: shape.y + worldDY }
              : shape
          )
        );
        setLastMousePos({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      if (dragging) {
        setDragging(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    dragging,
    selectedShapeIds,
    lastMousePos,
    scale,
    setShapes,
    setDragging,
    setLastMousePos,
  ]);
}
