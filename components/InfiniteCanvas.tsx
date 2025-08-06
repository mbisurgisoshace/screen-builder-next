"use client";
import { useRef, useState, useEffect } from "react";
import { Shape } from "./CanvasModule/Shape";
import SelectionGroup from "./CanvasModule/SelectionBox";
import { useCanvasTransform } from "./CanvasModule/hooks/useCanvasTransform";
import { useMarqueeSelection } from "./CanvasModule/hooks/useMarqueeSelection";

type ShapeType = "rect" | "ellipse" | "text";

interface Shape {
  id: number;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text?: string;
}

export default function InfiniteCanvas() {
  const { scale, canvasRef, position, setPosition, setScale } =
    useCanvasTransform();

  // Shapes
  const [shapes, setShapes] = useState<Shape[]>([
    {
      id: 1,
      type: "rect",
      x: 500,
      y: 500,
      width: 160,
      height: 112,
      color: "bg-blue-500",
    },
  ]);

  // Selection & interaction
  const [selectedShapeIds, setSelectedShapeIds] = useState<number[]>([]);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<null | {
    id: number;
    handle: string;
  }>(null);

  // Panning & marquee selection
  const [isPanning, setIsPanning] = useState(false);
  const [canvasMousePos, setCanvasMousePos] = useState({ x: 0, y: 0 });

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

  // Shape ID generator
  const nextIdRef = useRef(1000);

  // --- Mouse handling ---
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.draggable) return;

      // Middle mouse → start panning
      if (e.button === 1) {
        e.preventDefault();
        setIsPanning(true);
        setCanvasMousePos({ x: e.clientX, y: e.clientY });
        return;
      }

      // Multi-selection bounding box click → move group
      if (target.dataset.groupdrag === "true") {
        setDragging(true);
        setCanvasMousePos({ x: e.clientX, y: e.clientY });
        return;
      }

      if (!target.dataset.shapeid && !target.dataset.handle) {
        startMarquee(e.clientX, e.clientY);
        setMarqueeMousePos({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Panning
      if (isPanning) {
        const dx = e.clientX - canvasMousePos.x;
        const dy = e.clientY - canvasMousePos.y;
        setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setCanvasMousePos({ x: e.clientX, y: e.clientY });
        return;
      }

      // Resizing
      if (resizing) {
        const dx = (e.clientX - canvasMousePos.x) / scale;
        const dy = (e.clientY - canvasMousePos.y) / scale;
        setShapes((prev) =>
          prev.map((shape) => {
            if (shape.id !== resizing.id) return shape;
            let { x, y, width, height } = shape;

            if (resizing.handle.includes("e")) width = Math.max(20, width + dx);
            if (resizing.handle.includes("s"))
              height = Math.max(20, height + dy);
            if (resizing.handle.includes("w")) {
              x += dx;
              width = Math.max(20, width - dx);
            }
            if (resizing.handle.includes("n")) {
              y += dy;
              height = Math.max(20, height - dy);
            }
            return { ...shape, x, y, width, height };
          })
        );
        setCanvasMousePos({ x: e.clientX, y: e.clientY });
        return;
      }

      // Dragging selection (single or multi)
      if (dragging && selectedShapeIds.length > 0) {
        const worldDX = (e.clientX - canvasMousePos.x) / scale;
        const worldDY = (e.clientY - canvasMousePos.y) / scale;
        setShapes((prev) =>
          prev.map((shape) =>
            selectedShapeIds.includes(shape.id)
              ? { ...shape, x: shape.x + worldDX, y: shape.y + worldDY }
              : shape
          )
        );
        setCanvasMousePos({ x: e.clientX, y: e.clientY });
        return;
      }
    };

    const handleMouseUp = () => {
      setDragging(false);
      setResizing(null);
      setIsPanning(false);
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    scale,
    position,
    canvasMousePos,
    shapes,
    selectedShapeIds,

    resizing,
    dragging,
    isPanning,
  ]);

  // --- Shape interactions ---
  const handleShapeMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    id: number
  ) => {
    e.stopPropagation();
    if (e.shiftKey) {
      setSelectedShapeIds((prev) =>
        prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
      );
    } else {
      setSelectedShapeIds([id]);
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

  const renderHandles = (shape: Shape) => {
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

  const getGroupBounds = () => {
    const selectedShapes = shapes.filter((s) =>
      selectedShapeIds.includes(s.id)
    );
    if (selectedShapes.length < 2) return null;
    const minX = Math.min(...selectedShapes.map((s) => s.x));
    const minY = Math.min(...selectedShapes.map((s) => s.y));
    const maxX = Math.max(...selectedShapes.map((s) => s.x + s.width));
    const maxY = Math.max(...selectedShapes.map((s) => s.y + s.height));
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  };

  const groupBounds = getGroupBounds();

  // --- Shape creation ---
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData("shape-type") as ShapeType;
    if (!type) return;

    // Canvas coords adjusted for pan/zoom
    const dropX = (e.clientX - position.x) / scale;
    const dropY = (e.clientY - position.y) / scale;

    const newId = nextIdRef.current++;
    const colors = [
      "bg-blue-400",
      "bg-green-400",
      "bg-yellow-400",
      "bg-pink-400",
      "bg-purple-400",
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const newShape: Shape = {
      id: newId,
      type,
      x: dropX,
      y: dropY,
      width: type === "text" ? 120 : 160,
      height: type === "text" ? 40 : 112,
      color,
      text: type === "text" ? "New text" : undefined,
    };

    setShapes((prev) => [...prev, newShape]);
    setSelectedShapeIds([newId]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
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

          {/* Shapes */}
          {shapes.map((shape) => (
            <Shape
              key={shape.id}
              shape={shape}
              renderHandles={renderHandles}
              selectedCount={selectedShapeIds.length}
              isSelected={selectedShapeIds.includes(shape.id)}
              onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
