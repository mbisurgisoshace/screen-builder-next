"use client";
import { useRef, useState, useEffect } from "react";

import { Shape as IShape, Position, ShapeType } from "./CanvasModule/types";
import SelectionGroup from "./CanvasModule/SelectionBox";
import { useShapeDragging } from "./CanvasModule/hooks/useShapeDragging";
import { useCanvasTransform } from "./CanvasModule/hooks/useCanvasTransform";
import { useMarqueeSelection } from "./CanvasModule/hooks/useMarqueeSelection";
import { Shape } from "./CanvasModule/Shape";
import { useShapeResizing } from "./CanvasModule/hooks/useShapeResizing";
import { useCanvasInteraction } from "./CanvasModule/hooks/useCanvasInteraction";
import { useShapeInteraction } from "./CanvasModule/hooks/useShapeInteraction";
import { useShapeManager } from "./CanvasModule/hooks/useShapeManager";
import { shapeRegistry } from "./CanvasModule/blocks/blockRegistry";

export default function InfiniteCanvas() {
  const { scale, canvasRef, position, setPosition, setScale } =
    useCanvasTransform();

  const [connecting, setConnecting] = useState<{
    fromShapeId: number;
    fromDirection: "top" | "right" | "bottom" | "left";
    fromPosition: { x: number; y: number };
  } | null>(null);

  const [connectingMousePos, setConnectingMousePos] = useState<Position | null>(
    null
  );

  const [isDraggingConnector, setIsDraggingConnector] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (connecting) {
        const x = (e.clientX - position.x) / scale;
        const y = (e.clientY - position.y) / scale;
        setConnectingMousePos({ x, y });

        if (!isDraggingConnector) setIsDraggingConnector(true);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingConnector) {
        setConnecting(null);
        setConnectingMousePos(null);
        setIsDraggingConnector(false);
      }
    };

    if (connecting) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [connecting, position, scale, isDraggingConnector]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConnecting(null);
        setConnectingMousePos(null);
        setIsDraggingConnector(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const {
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
  } = useShapeManager(scale, position);

  // Panning & marquee selection
  const [isPanning, setIsPanning] = useState(false);
  const [canvasMousePos, setCanvasMousePos] = useState<Position>({
    x: 0,
    y: 0,
  });

  const {
    marquee,
    startMarquee,
    setLastMousePos: setMarqueeMousePos,
  } = useMarqueeSelection({
    scale,
    position,
    shapes,
    setSelectedShapeIds,
  });

  useShapeDragging({
    selectedShapeIds,
    setShapes,
    scale,
    setLastMousePos: setCanvasMousePos,
    lastMousePos: canvasMousePos,
    shapes,
    dragging,
    setDragging,
  });

  useShapeResizing({
    resizing,
    setResizing,
    shapes,
    setShapes,
    scale,
    lastMousePos: canvasMousePos,
    setLastMousePos: setCanvasMousePos,
  });

  useCanvasInteraction({
    canvasRef,
    setPosition,
    canvasMousePos,
    setCanvasMousePos,
    scale,
    setIsPanning,
    setResizing,
    setDragging,
    startMarquee,
    setMarqueeMousePos,
  });

  const { handleShapeMouseDown, startResizing } = useShapeInteraction({
    toggleSelection,
    selectOnly,
    setDragging,
    setCanvasMousePos,
    setResizing,
  });

  // Shape ID generator
  const nextIdRef = useRef(1000);

  const renderHandles = (shape: IShape) => {
    const handles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
    return handles.map((handle) => {
      const size = 8;
      const style: React.CSSProperties = {
        width: `${size}px`,
        height: `${size}px`,
        background: "#3B82F6",
        position: "absolute",
        cursor: `${handle}-resize`,
        zIndex: 40,
      };
      if (handle.includes("n")) style.top = `-4px`;
      if (handle.includes("s")) style.top = `calc(100% + 4px)`;
      if (handle.includes("w")) style.left = `-4px`;
      if (handle.includes("e")) style.left = `calc(100% + 4px)`;
      if (handle === "n" || handle === "s") style.left = "50%";
      if (handle === "e" || handle === "w") style.top = "50%";
      style.transform = "translate(-50%, -50%)";
      return (
        <div
          key={handle}
          data-handle
          onMouseDown={(e) => startResizing(e, shape.id, handle)}
          style={style}
        />
      );
    });
  };

  const handleConnectorMouseDown = (
    e: React.MouseEvent,
    shapeId: number,
    direction: "top" | "right" | "bottom" | "left"
  ) => {
    e.preventDefault();

    const shape = shapes.find((s) => s.id === shapeId);
    if (!shape) return;

    // Calculate the exact starting point of the arrow
    const shapeCenter = {
      x: shape.x + shape.width / 2,
      y: shape.y + shape.height / 2,
    };

    let fromX = shapeCenter.x;
    let fromY = shapeCenter.y;

    switch (direction) {
      case "top":
        fromY = shape.y;
        break;
      case "bottom":
        fromY = shape.y + shape.height;
        break;
      case "left":
        fromX = shape.x;
        break;
      case "right":
        fromX = shape.x + shape.width;
        break;
    }

    setConnecting({
      fromShapeId: shapeId,
      fromDirection: direction,
      fromPosition: { x: fromX, y: fromY },
    });

    // Prevent other interactions
    setDragging(false);
    setResizing(null);
  };

  const groupBounds = getGroupBounds();

  // --- Shape creation ---
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData("shape-type") as ShapeType;
    if (!type) return;

    addShape(type, e.clientX, e.clientY);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  console.log("connecting", connecting, connectingMousePos);

  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-100 relative flex">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-20 bg-white p-2 rounded shadow flex flex-col gap-2">
        <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("shape-type", "rect");
          }}
          className="w-10 h-10 bg-blue-400 rounded"
          title="Rectangle"
        />
        <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("shape-type", "ellipse");
          }}
          className="w-10 h-10 bg-green-400 rounded-full"
          title="Ellipse"
        />
        <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("shape-type", "text");
          }}
          className="w-10 h-10 flex items-center justify-center bg-yellow-300 rounded text-black font-bold"
          title="Text"
        >
          A
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
      >
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Marquee selection */}
          {marquee && (
            <div
              style={{
                position: "absolute",
                left: `${marquee.x}px`,
                top: `${marquee.y}px`,
                width: `${marquee.w}px`,
                height: `${marquee.h}px`,
                background: "rgba(96, 165, 250, 0.2)",
                border: "1px solid #60A5FA",
                zIndex: 100,
                pointerEvents: "none",
              }}
            />
          )}

          {/* Group bounding box */}
          {groupBounds && <SelectionGroup bounds={groupBounds} />}

          {connecting && connectingMousePos && (
            <svg
              className="absolute top-0 left-0 w-full h-full pointer-events-none z-30"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: "0 0",
              }}
            >
              {/* <line
                x1={connecting.fromPosition.x}
                y1={connecting.fromPosition.y}
                x2={connectingMousePos.x}
                y2={connectingMousePos.y}
                stroke="#3B82F6"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              /> */}
              <CurvedArrow
                from={connecting.fromPosition}
                to={connectingMousePos}
              />
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
                </marker>
              </defs>
            </svg>
          )}

          {shapes.map((shape) => {
            const Component = shapeRegistry[shape.type];
            if (!Component) return null;

            return (
              <Component
                key={shape.id}
                shape={shape}
                renderHandles={renderHandles}
                selectedCount={selectedShapeIds.length}
                isSelected={selectedShapeIds.includes(shape.id)}
                onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
                onConnectorMouseDown={handleConnectorMouseDown}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface CurvedArrowProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color?: string;
  strokeWidth?: number;
}

export const CurvedArrow: React.FC<CurvedArrowProps> = ({
  from,
  to,
  color = "#3B82F6",
  strokeWidth = 2,
}) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  const curveFactor = 0.3;
  const cp1 = {
    x: from.x + dx * curveFactor,
    y: from.y,
  };
  const cp2 = {
    x: to.x - dx * curveFactor,
    y: to.y,
  };

  const path = `M ${from.x},${from.y} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${to.x},${to.y}`;

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
      <path d={path} stroke={color} strokeWidth={strokeWidth} fill="none" />
      <circle cx={to.x} cy={to.y} r={3} fill={color} />
    </svg>
  );
};
