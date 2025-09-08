// CanvasModule/hooks/useShapeManager.ts
import { useState, useRef } from "react";
import { Shape as IShape, ShapeType, Position } from "../types";

type ResizeState = { id: string; handle: string } | null;

export function useShapeManager(
  scale: number,
  position: Position,
  shapes: IShape[]
) {
  const [_, setShapes] = useState<IShape[]>([
    // {
    //   id: 1,
    //   type: "rect",
    //   x: 500,
    //   y: 500,
    //   width: 160,
    //   height: 112,
    //   color: "bg-blue-500",
    // },
  ]);

  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [resizing, setResizing] = useState<ResizeState>(null);
  const [dragging, setDragging] = useState(false);

  const nextIdRef = useRef(1000);

  // --- Selection ---
  const toggleSelection = (id: string) => {
    setSelectedShapeIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const selectOnly = (id: string) => setSelectedShapeIds([id]);

  const clearSelection = () => setSelectedShapeIds([]);

  const getSelectedShapes = () =>
    shapes.filter((s) => selectedShapeIds.includes(s.id));

  // --- Bounds for group selection ---
  const getGroupBounds = () => {
    const selected = getSelectedShapes();

    if (selected.length < 2) return null;
    const minX = Math.min(...selected.map((s) => s.x));
    const minY = Math.min(...selected.map((s) => s.y));
    const maxX = Math.max(...selected.map((s) => s.x + s.width));
    const maxY = Math.max(...selected.map((s) => s.y + s.height));
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  };

  // --- Shape add/update ---
  const addShape = (type: ShapeType, clientX: number, clientY: number) => {
    const dropX = (clientX - position.x) / scale;
    const dropY = (clientY - position.y) / scale;

    // const newId = nextIdRef.current++;
    const newId = "";
    const colors = [
      "bg-blue-400",
      "bg-green-400",
      "bg-yellow-400",
      "bg-pink-400",
      "bg-purple-400",
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const newShape: IShape = {
      id: newId,
      type,
      x: dropX,
      y: dropY,
      width: type === "text" ? 120 : 160,
      height: type === "text" ? 40 : 112,
      color,
      text: type === "text" ? "New text" : undefined,
    };

    //setShapes((prev) => [...prev, newShape]);
    setSelectedShapeIds([newId]);
  };

  const updateShape = (id: string, updater: (shape: IShape) => IShape) => {
    //setShapes((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
  };

  return {
    shapes,
    setShapes,
    selectedShapeIds,
    setSelectedShapeIds,
    toggleSelection,
    selectOnly,
    clearSelection,
    getSelectedShapes,
    getGroupBounds,
    resizing,
    setResizing,
    dragging,
    setDragging,
    addShape,
    updateShape,
  };
}
