"use client";
import { v4 as uuidv4 } from "uuid";
import { useRef, useState, useEffect } from "react";

import SelectionGroup from "./CanvasModule/SelectionBox";
import { Shape as IShape, Position, ShapeType } from "./CanvasModule/types";

import { shapeRegistry } from "./CanvasModule/blocks/blockRegistry";
import { useShapeManager } from "./CanvasModule/hooks/useShapeManager";
import { useShapeDragging } from "./CanvasModule/hooks/useShapeDragging";
import { useShapeResizing } from "./CanvasModule/hooks/useShapeResizing";
import { useBorderSnapping } from "./CanvasModule/hooks/useBorderSnapping";
import { useCanvasTransform } from "./CanvasModule/hooks/useCanvasTransform";
import { useMarqueeSelection } from "./CanvasModule/hooks/useMarqueeSelection";
import { useShapeInteraction } from "./CanvasModule/hooks/useShapeInteraction";
import { useCanvasInteraction } from "./CanvasModule/hooks/useCanvasInteraction";
import { useConnectionManager } from "./CanvasModule/hooks/useConnectionManager";
import { SelectableConnectionArrow } from "./CanvasModule/SelectableConnectionArrow";
import { useRealtimeShapes } from "./CanvasModule/hooks/realtime/useRealtimeShapes";
import { useRealtimeConnections } from "./CanvasModule/hooks/realtime/useRealtimeConnections";

type RelativeAnchor = {
  x: number; // valor entre 0 y 1, representa el porcentaje del ancho
  y: number; // valor entre 0 y 1, representa el porcentaje del alto
};

type Connection = {
  fromShapeId: string;
  fromAnchor: { x: number; y: number }; // relative [0-1] range
  toShapeId: string;
  toAnchor: { x: number; y: number }; // relative [0-1] range
};

export function getAbsoluteAnchorPosition(
  shape: IShape,
  anchor: { x: number; y: number }
): Position {
  return {
    x: shape.x + shape.width * anchor.x,
    y: shape.y + shape.height * anchor.y,
  };
}

export default function InfiniteCanvas() {
  const { scale, canvasRef, position, setPosition, setScale } =
    useCanvasTransform();

  const [connecting, setConnecting] = useState<{
    fromShapeId: string;
    fromDirection: "top" | "right" | "bottom" | "left";
    fromPosition: { x: number; y: number };
  } | null>(null);

  // const [connections, setConnections] = useState<
  //   {
  //     fromShapeId: number;
  //     fromDirection: "top" | "right" | "bottom" | "left";
  //     toShapeId: number;
  //     toPoint: { x: number; y: number };
  //   }[]
  // >([]);
  // const [connections, setConnections] = useState<Connection[]>([]);

  const [connectingMousePos, setConnectingMousePos] = useState<Position | null>(
    null
  );

  const [isDraggingConnector, setIsDraggingConnector] = useState(false);

  const {
    shapes,
    addShape,
    updateShape,
    updateMany,
    removeShapes,
    liveShapesReady,
  } = useRealtimeShapes();

  const {
    //shapes,
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
    //addShape,
    //updateShape,
  } = useShapeManager(scale, position, shapes);

  const {
    connections,
    finalizeFromSnap,
    useConnectionEndpoints,
    selectConnection,
    selectedConnectionId,
    removeSelectedConnection,
    removeConnection, // (for later)
    updateConnection, // (for later)
    addConnectionRelative, // (for later/manual adds)
  } = useConnectionManager();

  const connectionEndpoints = useConnectionEndpoints(shapes);

  // const { snapResult } = useBorderSnapping(connectingMousePos, shapes);
  const { snapResult } = useBorderSnapping(
    connectingMousePos,
    shapes,
    scale,
    connecting?.fromShapeId ?? null
  );

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
      if (isDraggingConnector && connecting && snapResult?.shapeId) {
        const fromShape = shapes.find((s) => s.id === connecting.fromShapeId);
        const toShape = shapes.find((s) => s.id === snapResult.shapeId);

        if (!fromShape || !toShape) {
          setConnecting(null);
          setConnectingMousePos(null);
          setIsDraggingConnector(false);
          return;
        }

        finalizeFromSnap({
          connecting, // { fromShapeId, fromDirection, fromPosition }
          snapResult, // { shapeId, snappedPosition }
          shapes,
        });

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
  }, [connecting, position, scale, isDraggingConnector, snapResult]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "Backspace" || e.key === "Delete") &&
        selectedConnectionId
      ) {
        e.preventDefault();
        removeSelectedConnection();
      }
      // Optional: ESC clears connection selection (and your shape selection if you want)
      if (e.key === "Escape" && selectedConnectionId) {
        selectConnection(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedConnectionId, removeSelectedConnection, selectConnection]);

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
    updateMany,
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
    updateShape,
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

  const handleConnectorMouseDown = (
    e: React.MouseEvent,
    shapeId: string,
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

    addShape(type, e.clientX, e.clientY, uuidv4());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  function getConnectorPosition(
    shape: IShape,
    direction: "top" | "right" | "bottom" | "left"
  ): { x: number; y: number } {
    switch (direction) {
      case "top":
        return { x: shape.x + shape.width / 2, y: shape.y };
      case "bottom":
        return { x: shape.x + shape.width / 2, y: shape.y + shape.height };
      case "left":
        return { x: shape.x, y: shape.y + shape.height / 2 };
      case "right":
      default:
        return { x: shape.x + shape.width, y: shape.y + shape.height / 2 };
    }
  }

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

          {/* {connecting && connectingMousePos && (
            <svg
              className="absolute top-0 left-0 w-full h-full pointer-events-none z-30"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: "0 0",
              }}
            >
              <CurvedArrow
                from={connecting.fromPosition}
                // to={connectingMousePos}
                to={snapResult?.snappedPosition ?? connectingMousePos}
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
          )} */}

          {/* {connecting && connectingMousePos && (
            <CurvedArrow
              from={connecting.fromPosition}
              to={connectingMousePos}
            />
          )} */}
          {connecting && connectingMousePos && (
            <CurvedArrow
              from={connecting.fromPosition}
              to={snapResult?.snappedPosition ?? connectingMousePos}
            />
          )}

          {/* {connectionEndpoints.map(({ id, from, to }) => (
            <CurvedArrow key={id} from={from} to={to} />
          ))} */}
          {/* {connectionEndpoints.map(({ id, from, to }) => {
            // build a cubic path like your CurvedArrow does
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const curveFactor = 0.3;
            const cp1 = { x: from.x + dx * curveFactor, y: from.y };
            const cp2 = { x: to.x - dx * curveFactor, y: to.y };
            const d = `M ${from.x},${from.y} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${to.x},${to.y}`;

            const isSelected = selectedConnectionId === id;

            return (
              <svg
                key={id}
                className="absolute top-0 left-0 w-full h-full z-20"
                style={{ pointerEvents: "none" }} // let only the thick path capture events
              >
                <path
                  d={d}
                  stroke="transparent"
                  strokeWidth={16}
                  fill="none"
                  style={{ pointerEvents: "stroke" }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    selectConnection(id);
                  }}
                />
                <path
                  d={d}
                  stroke={isSelected ? "#2563EB" : "#3B82F6"} // selected = darker blue
                  strokeWidth={isSelected ? 3 : 2}
                  fill="none"
                  markerEnd="url(#arrowhead)"
                />
              </svg>
            );
          })} */}
          {connectionEndpoints.map(({ id, from, to }) => (
            <SelectableConnectionArrow
              key={id}
              id={id}
              from={from}
              to={to}
              selected={selectedConnectionId === id}
              onSelect={selectConnection}
            />
          ))}

          {shapes.map((shape) => {
            const Component = shapeRegistry[shape.type];
            if (!Component) return null;

            return (
              <Component
                key={shape.id}
                shape={shape}
                //renderHandles={renderHandles}
                onResizeStart={startResizing}
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

// interface CurvedArrowProps {
//   from: { x: number; y: number };
//   to: { x: number; y: number };
//   color?: string;
//   strokeWidth?: number;
// }

// export const CurvedArrow: React.FC<CurvedArrowProps> = ({
//   from,
//   to,
//   color = "#3B82F6",
//   strokeWidth = 2,
// }) => {
//   const dx = to.x - from.x;
//   const dy = to.y - from.y;

//   const curveFactor = 0.3;
//   const cp1 = {
//     x: from.x + dx * curveFactor,
//     y: from.y,
//   };
//   const cp2 = {
//     x: to.x - dx * curveFactor,
//     y: to.y,
//   };

//   const path = `M ${from.x},${from.y} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${to.x},${to.y}`;

//   return (
//     <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
//       <path d={path} stroke={color} strokeWidth={strokeWidth} fill="none" />
//       <circle cx={to.x} cy={to.y} r={3} fill={color} />
//     </svg>
//   );
// };

interface CurvedArrowProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color?: string;
  strokeWidth?: number;
  zIndex?: number; // optional, defaults below
}

/**
 * An SVG that auto-sizes to the arrow's bounding box so it never clips
 * when the canvas is heavily panned/zoomed.
 */
export const CurvedArrow: React.FC<CurvedArrowProps> = ({
  from,
  to,
  color = "#3B82F6",
  strokeWidth = 2,
  zIndex = 30,
}) => {
  // Compute a padded bounding box around the two points
  const pad = 40;
  const minX = Math.min(from.x, to.x) - pad;
  const minY = Math.min(from.y, to.y) - pad;
  const maxX = Math.max(from.x, to.x) + pad;
  const maxY = Math.max(from.y, to.y) + pad;

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  // Convert world points to local coords within this svg
  const fx = from.x - minX;
  const fy = from.y - minY;
  const tx = to.x - minX;
  const ty = to.y - minY;

  // Curve control points (same logic as before, but in local coords)
  const dx = tx - fx;
  const dy = ty - fy;
  const curveFactor = 0.3;
  const cp1 = { x: fx + dx * curveFactor, y: fy };
  const cp2 = { x: tx - dx * curveFactor, y: ty };

  const d = `M ${fx},${fy} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${tx},${ty}`;

  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        left: `${minX}px`,
        top: `${minY}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex,
      }}
    >
      <defs>
        <marker
          id="arrowhead-preview"
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={color} />
        </marker>
      </defs>

      {/* wide transparent hit area not needed for preview; keep only visible path */}
      <path
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        markerEnd="url(#arrowhead-preview)"
      />
    </svg>
  );
};
