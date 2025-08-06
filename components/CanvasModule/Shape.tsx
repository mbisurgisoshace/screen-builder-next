import React from "react";
import { Shape as IShape } from "./types";

interface Props {
  shape: IShape;
  isSelected: boolean;
  selectedCount: number;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  renderHandles?: (shape: IShape) => React.ReactNode;
}

export const Shape: React.FC<Props> = ({
  shape,
  isSelected,
  onMouseDown,
  renderHandles,
  selectedCount,
}) => {
  return (
    <div
      data-shapeid={shape.id}
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        left: `${shape.x}px`,
        top: `${shape.y}px`,
        width: `${shape.width}px`,
        height: `${shape.height}px`,
        zIndex: isSelected ? 20 : 1,
      }}
    >
      {isSelected && selectedCount === 1 && (
        <>
          {/* Selection outline */}
          <div
            style={{
              position: "absolute",
              top: "-4px",
              left: "-4px",
              width: `${shape.width + 8}px`,
              height: `${shape.height + 8}px`,
              border: "2px solid #60A5FA",
              borderRadius: "4px",
              pointerEvents: "none",
              zIndex: 30,
            }}
          />
          {/* Resize handles */}
          {renderHandles?.(shape)}
        </>
      )}

      {/* Main shape */}
      <div
        className={`${shape.color} flex items-center justify-center rounded shadow w-full h-full`}
        style={{
          position: "relative",
          zIndex: 25,
          borderRadius: shape.type === "ellipse" ? "9999px" : undefined,
        }}
      >
        {shape.type === "text" ? shape.text : shape.type.toUpperCase()}
      </div>
    </div>
  );
};
