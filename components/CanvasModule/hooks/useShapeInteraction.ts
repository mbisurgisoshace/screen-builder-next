import { Position } from "../types";

export function useShapeInteraction({
  setSelectedShapeIds,
  setDragging,
  setCanvasMousePos,
  setResizing,
}: {
  setSelectedShapeIds: React.Dispatch<React.SetStateAction<number[]>>;
  setDragging: React.Dispatch<React.SetStateAction<boolean>>;
  setCanvasMousePos: (pos: Position) => void;
  setResizing: React.Dispatch<
    React.SetStateAction<{ id: number; handle: string } | null>
  >;
}) {
  const handleShapeMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    id: number
  ) => {
    e.stopPropagation();
    if (e.shiftKey) {
      setSelectedShapeIds((prev) =>
        prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
      );
    } else {
      setSelectedShapeIds([id]);
    }
    setDragging(true);
    setCanvasMousePos({ x: e.clientX, y: e.clientY });
  };

  const startResizing = (
    e: React.MouseEvent<HTMLDivElement>,
    id: number,
    handle: string
  ) => {
    e.stopPropagation();
    setResizing({ id, handle });
    setCanvasMousePos({ x: e.clientX, y: e.clientY });
  };

  return {
    handleShapeMouseDown,
    startResizing,
  };
}
