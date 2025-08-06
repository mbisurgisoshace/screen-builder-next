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
    { id: 1, x: 500, y: 500, width: 160, height: 112, color: "#e74c3c" },
  ]);
  const [draggingShapeId, setDraggingShapeId] = useState<number | null>(null);
  const [selectedShapeId, setSelectedShapeId] = useState<number | null>(null);

  // --- Panning & Dragging ---
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.dataset.shapeid) return; // skip panning if clicking a shape
      setSelectedShapeId(null); // deselect if clicking empty space
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

  // --- Shape interactions ---
  const startDraggingShape = (
    e: React.MouseEvent<HTMLDivElement>,
    id: number
  ) => {
    e.stopPropagation();
    setSelectedShapeId(id); // select on click
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
            className="relative"
          >
            {/* Selection box */}
            {selectedShapeId === shape.id && (
              <div
                className="absolute border-2 border-blue-500 rounded pointer-events-none"
                style={{
                  top: "-4px",
                  left: "-4px",
                  width: `${shape.width + 8}px`,
                  height: `${shape.height + 8}px`,
                  zIndex: 30, // force above shape
                }}
              />
            )}
            {/* Shape */}
            <div
              style={{
                zIndex: 25,
                backgroundColor: shape.color,
                position: "relative",
              }}
              className={
                "text-white flex items-center justify-center rounded shadow w-full h-full"
              }
            >
              Shape {shape.id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
