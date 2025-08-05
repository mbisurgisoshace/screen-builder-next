"use client";
import { useRef, useState, useEffect } from "react";

export default function InfiniteCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Canvas transform state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Shapes state
  const [shapes, setShapes] = useState([
    { id: 1, x: 500, y: 500, width: 160, height: 112, color: "bg-blue-500" },
    { id: 2, x: 750, y: 750, width: 160, height: 112, color: "bg-blue-500" },
  ]);
  const [draggingShapeId, setDraggingShapeId] = useState<number | null>(null);

  // --- Panning ---
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).dataset.shapeid) return; // skip if clicking shape
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (draggingShapeId !== null) {
        const worldDX = (e.clientX - lastMousePos.x) / scale;
        const worldDY = (e.clientY - lastMousePos.y) / scale;

        setShapes((prev) =>
          prev.map((shape) =>
            shape.id === draggingShapeId
              ? { ...shape, x: shape.x + worldDX, y: shape.y + worldDY }
              : shape
          )
        );
        setLastMousePos({ x: e.clientX, y: e.clientY });
      } else if (isPanning) {
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;
        setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastMousePos({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      setDraggingShapeId(null);
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPanning, lastMousePos, draggingShapeId, scale]);

  // --- Zoom with mouse position ---
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();

      const zoomIntensity = 0.001;
      const delta = -e.deltaY * zoomIntensity;

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const worldX = (mouseX - position.x) / scale;
      const worldY = (mouseY - position.y) / scale;

      let newScale = scale + delta;
      newScale = Math.min(Math.max(newScale, 0.1), 4);

      setPosition({
        x: mouseX - worldX * newScale,
        y: mouseY - worldY * newScale,
      });

      setScale(newScale);
    };

    el.addEventListener("wheel", handleWheelEvent, { passive: false });

    return () => {
      el.removeEventListener("wheel", handleWheelEvent);
    };
  }, [scale, position]);

  // --- Shape dragging ---
  const startDraggingShape = (
    e: React.MouseEvent<HTMLDivElement>,
    id: number
  ) => {
    e.stopPropagation();
    setDraggingShapeId(id);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      ref={canvasRef}
      className="w-screen h-screen overflow-hidden bg-gray-100 relative"
      style={{ cursor: isPanning ? "grabbing" : "grab" }}
    >
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 bg-white p-2 rounded shadow flex gap-2">
        <button onClick={() => setScale((s) => Math.min(s + 0.1, 4))}>
          Zoom +
        </button>
        <button onClick={() => setScale((s) => Math.max(s - 0.1, 0.1))}>
          Zoom -
        </button>
        <button onClick={() => setPosition({ x: 0, y: 0 })}>Reset Pan</button>
        <button onClick={() => setScale(1)}>Reset Zoom</button>
      </div>

      {/* Infinite World */}
      <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {shapes.map((shape) => (
          <div
            key={shape.id}
            data-shapeid={shape.id}
            onMouseDown={(e) => startDraggingShape(e, shape.id)}
            style={{
              position: "absolute",
              left: `${shape.x}px`,
              top: `${shape.y}px`,
              width: `${shape.width}px`,
              height: `${shape.height}px`,
            }}
            className={`${shape.color} text-white flex items-center justify-center rounded shadow`}
          >
            Shape {shape.id}
          </div>
        ))}
      </div>
    </div>
  );
}
