import { ShapeComponentProps } from "../../types";

export function Text({
  shape,
  isSelected,
  selectedCount,
  onMouseDown,
  renderHandles,
}: ShapeComponentProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      data-shapeid={shape.id}
      style={{
        position: "absolute",
        left: shape.x,
        top: shape.y,
        width: shape.width,
        height: shape.height,
        padding: "4px",
        whiteSpace: "pre-wrap",
      }}
      className={`absolute bg-white border ${
        isSelected && selectedCount === 1 ? "ring-2 ring-blue-500" : ""
      }`}
    >
      {shape.text || "Text"}
      {isSelected && selectedCount === 1 && renderHandles(shape)}
    </div>
  );
}
