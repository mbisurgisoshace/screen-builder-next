import { Position } from "../types";

type UseShapeInteractionParams = {
  setDragging: React.Dispatch<React.SetStateAction<boolean>>;
  setCanvasMousePos: (pos: Position) => void;
  toggleSelection: (id: string) => void;
  selectOnly: (id: string) => void;
  setResizing: React.Dispatch<
    React.SetStateAction<{ id: string; handle: string } | null>
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
    id: string
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
    id: string,
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
