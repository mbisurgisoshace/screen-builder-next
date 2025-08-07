import { renderConnectorPoints } from "../../Shape";
import { ShapeComponentProps } from "../../types";

export function Ellipse({
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
        borderRadius: "9999px",
      }}
      className={`absolute ${shape.color} ${
        isSelected && selectedCount === 1 ? "ring-2 ring-blue-500" : ""
      }`}
    >
      {isSelected && selectedCount === 1 && (
        <>
          {renderHandles(shape)}
          {renderConnectorPoints(shape)}
        </>
      )}
    </div>
  );
}
