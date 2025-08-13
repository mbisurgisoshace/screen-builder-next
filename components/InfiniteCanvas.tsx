"use client";
import { v4 as uuidv4 } from "uuid";
import {
  useUndo,
  useRedo,
  useCanUndo,
  useHistory,
  useCanRedo,
} from "@liveblocks/react";
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

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const { pause, resume } = useHistory();

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
    removeConnectionsByIds,
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
      // if (
      //   (e.key === "Backspace" || e.key === "Delete") &&
      //   selectedConnectionId
      // ) {
      //   e.preventDefault();
      //   removeSelectedConnection();
      // }
      if (isTypingIntoField(e.target)) return;

      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          // Redo: Shift+Cmd/Ctrl+Z
          redo();
        } else {
          // Undo: Cmd/Ctrl+Z
          undo();
        }
        return;
      }
      // Windows-style redo: Ctrl+Y
      if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }

      const isDelete = e.key === "Backspace" || e.key === "Delete";

      if (isDelete) {
        // If a connection is selected, delete that first (preserves your existing UX)
        if (selectedConnectionId) {
          e.preventDefault();
          removeSelectedConnection();
          return;
        }

        // Otherwise, delete shapes (and their connections)
        if (selectedShapeIds.length > 0) {
          e.preventDefault();
          deleteSelectedShapes();
          return;
        }
      }

      // Optional: ESC clears connection selection (and your shape selection if you want)
      if (e.key === "Escape" && selectedConnectionId) {
        selectConnection(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    selectedConnectionId,
    removeSelectedConnection,
    selectConnection,
    undo,
    redo,
  ]);

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

  // helper: load a File as data URL
  function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  }

  // helper: probe natural size from URL/dataURL
  function getImageSize(src: string): Promise<{ w: number; h: number }> {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = rej;
      img.src = src;
    });
  }

  // --- Shape creation ---
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData("shape-type") as ShapeType;
    if (!canvasRef.current) return;

    const dt = e.dataTransfer;
    const { x, y } = clientToWorld(e, canvasRef.current, position, scale);

    const files = Array.from(dt.files || []);
    const imageFile = files.find((f) => f.type && f.type.startsWith("image/"));

    if (imageFile) {
      const id = uuidv4();
      // place a provisional image block at the drop point
      addShape("image", x, y, id);

      try {
        const dataURL = await readFileAsDataURL(imageFile);
        const { w: natW, h: natH } = await getImageSize(dataURL);

        // scale down large images for initial placement (optional)
        const maxW = 480;
        const scaleFactor = natW > maxW ? maxW / natW : 1;
        const width = Math.max(40, Math.round(natW * scaleFactor));
        const height = Math.max(40, Math.round(natH * scaleFactor));

        // center under cursor and set src
        updateShape(id, (s) => ({
          ...s,
          src: dataURL,
          keepAspect: true,
          x: x - width / 2,
          y: y - height / 2,
          width,
          height,
        }));
      } catch (err) {
        // If reading fails, remove provisional block
        removeShapes([id]);
        console.error("Failed to load dropped image", err);
      }
      return;
    }

    // 2) Dragged IMAGE URL (e.g., from another tab)
    const urlFromUriList = dt.getData("text/uri-list");
    let imageUrl = urlFromUriList || "";
    if (!imageUrl) {
      const text = dt.getData("text/plain");
      if (
        text &&
        /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(text)
      ) {
        imageUrl = text.trim();
      }
    }
    if (imageUrl) {
      const id = uuidv4();
      addShape("image", x, y, id);
      try {
        const { w: natW, h: natH } = await getImageSize(imageUrl);
        const maxW = 480;
        const scaleFactor = natW > maxW ? maxW / natW : 1;
        const width = Math.max(40, Math.round(natW * scaleFactor));
        const height = Math.max(40, Math.round(natH * scaleFactor));

        updateShape(id, (s) => ({
          ...s,
          src: imageUrl,
          keepAspect: true,
          x: x - width / 2,
          y: y - height / 2,
          width,
          height,
        }));
      } catch (err) {
        removeShapes([id]);
        console.error("Failed to load dropped image URL", err);
      }
      return;
    }

    if (!type) return;
    //addShape(type, e.clientX, e.clientY, uuidv4());
    addShape(type, x, y, uuidv4());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  function clientToWorld(
    e: React.DragEvent | React.MouseEvent,
    canvasEl: HTMLDivElement,
    position: { x: number; y: number },
    scale: number
  ) {
    const rect = canvasEl.getBoundingClientRect();
    const x = (e.clientX - rect.left - position.x) / scale;
    const y = (e.clientY - rect.top - position.y) / scale;
    return { x, y };
  }

  function isTypingIntoField(target: EventTarget | null) {
    const el = target as HTMLElement | null;
    if (!el) return false;
    return !!el.closest('input, textarea, [contenteditable="true"]');
  }

  const deleteSelectedShapes = () => {
    if (selectedShapeIds.length === 0) return;

    // 1) Remove all arrows attached to any of these shapes
    removeConnectionsByIds(selectedShapeIds);

    // 2) Remove the shapes themselves
    removeShapes(selectedShapeIds);

    // 3) Clear selection & any in-progress connection
    clearSelection?.();
    setConnecting?.(null);
    setConnectingMousePos?.(null);
    setIsDraggingConnector?.(false);
  };

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
          Tx
        </button>
        <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("shape-type", "interview");
          }}
          className="w-10 h-10 flex items-center justify-center bg-purple-300 rounded text-black font-bold"
          title="Interview"
        >
          In
        </button>

        <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("shape-type", "table");
          }}
          className="w-10 h-10 flex items-center justify-center bg-purple-200 rounded text-black font-bold"
          title="Table"
        >
          Tb
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
            <CurvedArrow
              from={connecting.fromPosition}
              to={snapResult?.snappedPosition ?? connectingMousePos}
            />
          )}

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
                //@ts-ignore
                onCommitText={(id, text) =>
                  updateShape(id, (s) => ({
                    ...s,
                    // keep empty strings if user clears the text; Liveblocks adapter already null-coalesces
                    text,
                  }))
                }
                //@ts-ignore
                onCommitInterview={(id, patch) =>
                  updateShape(id, (s) => ({ ...s, ...patch }))
                }
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
