import { useEffect } from "react";
import { useHistory } from "@liveblocks/react";

import { Position, Shape } from "../types";

interface UseShapeDraggingParams {
  scale: number;
  selectedShapeIds: string[];
  shapes: Shape[];
  setShapes: (shapes: Shape[] | ((prev: Shape[]) => Shape[])) => void;
  setDragging: (dragging: boolean) => void;
  dragging: boolean;
  updateMany: (ids: string[], updater: (s: Shape) => Shape) => void;
  lastMousePos: Position;
  setLastMousePos: (pos: Position) => void;
}

export function useShapeDragging({
  scale,
  updateMany,
  selectedShapeIds,
  shapes,
  setShapes,
  setDragging,
  dragging,
  lastMousePos,
  setLastMousePos,
}: UseShapeDraggingParams) {
  const { pause, resume } = useHistory();

  useEffect(() => {
    let didPause = false;
    if (dragging) {
      pause();
      didPause = true;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (dragging && selectedShapeIds.length > 0) {
        const worldDX = (e.clientX - lastMousePos.x) / scale;
        const worldDY = (e.clientY - lastMousePos.y) / scale;
        // setShapes((prev) =>
        //   prev.map((shape) =>
        //     selectedShapeIds.includes(shape.id)
        //       ? { ...shape, x: shape.x + worldDX, y: shape.y + worldDY }
        //       : shape
        //   )
        // );
        updateMany(selectedShapeIds, (s) => ({
          ...s,
          x: s.x + worldDX,
          y: s.y + worldDY,
        }));
        setLastMousePos({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      if (dragging) {
        setDragging(false);

        if (didPause) {
          resume();
          didPause = false;
        }
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
