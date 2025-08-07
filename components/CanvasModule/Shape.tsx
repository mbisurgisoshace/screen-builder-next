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

export const renderConnectorPoints = () => {
  const dotSize = 8;
  const offset = 12; // A bit more than before for visual balance

  const points = [
    {
      id: "top",
      style: {
        left: "50%",
        top: `-${offset + 8}px`,
        transform: "translateX(-50%)",
      },
    },
    {
      id: "right",
      style: {
        left: `calc(100% + ${offset}px)`,
        top: "50%",
        transform: "translateY(-50%)",
      },
    },
    {
      id: "bottom",
      style: {
        left: "50%",
        top: `calc(100% + ${offset}px)`,
        transform: "translateX(-50%)",
      },
    },
    {
      id: "left",
      style: {
        left: `-${offset + 8}px`,
        top: "50%",
        transform: "translateY(-50%)",
      },
    },
  ];

  const getArrowRotation = (position: string) => {
    switch (position) {
      case "top":
        return "-90deg";
      case "bottom":
        return "90deg";
      case "left":
        return "180deg";
      case "right":
      default:
        return "0deg";
    }
  };

  return points.map((point) => (
    <div
      key={point.id}
      data-connector-id={point.id}
      className="group absolute z-40"
      style={point.style}
    >
      <div className="w-2 h-2 rounded-full bg-blue-500 transition-all duration-200 group-hover:scale-150 group-hover:bg-blue-600 relative flex items-center justify-center">
        <svg
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-2 h-2 text-white"
          viewBox="0 0 20 20"
          fill="currentColor"
          style={{ transform: `rotate(${getArrowRotation(point.id)})` }}
        >
          <path d="M10 4l6 6-6 6-1.5-1.5L12 10 8.5 6.5 10 4z" />
        </svg>
      </div>
    </div>
  ));
};
