import { Position } from "../types";

type UseShapeInteractionParams = {
  setDragging: React.Dispatch<React.SetStateAction<boolean>>;
  setCanvasMousePos: (pos: Position) => void;
  toggleSelection: (id: number) => void;
  selectOnly: (id: number) => void;
  setResizing: React.Dispatch<
    React.SetStateAction<{ id: number; handle: string } | null>
  >;
};

export function useShapeInteraction({
  //setSelectedShapeIds,
  setDragging,
  setCanvasMousePos,
  setResizing,
  toggleSelection,
  selectOnly,
}: UseShapeInteractionParams) {
  const handleShapeMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    id: number
  ) => {
    e.stopPropagation();
    if (e.shiftKey) {
      toggleSelection(id);
    } else {
      selectOnly(id);
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
