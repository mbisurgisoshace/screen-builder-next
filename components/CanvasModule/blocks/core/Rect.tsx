import { renderConnectorPoints } from "../../Shape";
import { ShapeComponentProps } from "../../types";

export function Rect(props: ShapeComponentProps) {
  const {
    shape,
    isSelected,
    selectedCount,
    onMouseDown,
    renderHandles,
    onConnectorMouseDown,
  } = props;
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
      }}
      className={`absolute ${shape.color} ${
        isSelected && selectedCount === 1 ? "ring-2 ring-blue-500" : ""
      }`}
    >
      {isSelected && selectedCount === 1 && (
        <>
          {renderHandles(shape)}
          {onConnectorMouseDown &&
            renderConnectorPoints(shape.id, onConnectorMouseDown)}
        </>
      )}
    </div>
  );
}
