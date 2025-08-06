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
    { id: 2, x: 650, y: 650, width: 200, height: 140, color: "bg-red-500" },
    { id: 3, x: 700, y: 700, width: 120, height: 160, color: "bg-green-500" },
  ]);

  // Selection & dragging/resizing state
  const [selectedShapeIds, setSelectedShapeIds] = useState<number[]>([]);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<null | {
    id: number;
    handle: string;
  }>(null);

  // --- Panning, dragging, resizing ---
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.dataset.shapeid || target.dataset.handle) return; // skip if clicking shape/handle
      setSelectedShapeIds([]);
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Resizing (only if single shape selected)
      if (resizing) {
        const dx = (e.clientX - lastMousePos.x) / scale;
        const dy = (e.clientY - lastMousePos.y) / scale;
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
        setLastMousePos({ x: e.clientX, y: e.clientY });
        return;
      }

      // Dragging shapes (single or multi)
      if (dragging && selectedShapeIds.length > 0) {
        const worldDX = (e.clientX - lastMousePos.x) / scale;
        const worldDY = (e.clientY - lastMousePos.y) / scale;

        setShapes((prev) =>
          prev.map((shape) =>
            selectedShapeIds.includes(shape.id)
              ? { ...shape, x: shape.x + worldDX, y: shape.y + worldDY }
              : shape
          )
        );
        setLastMousePos({ x: e.clientX, y: e.clientY });
        return;
      }

      // Panning
      if (isPanning) {
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;
        setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastMousePos({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      setDragging(false);
      setResizing(null);
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPanning, lastMousePos, dragging, scale, selectedShapeIds, resizing]);

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
    return () => el.removeEventListener("wheel", handleWheelEvent);
  }, [scale, position]);

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
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const startResizing = (
    e: React.MouseEvent<HTMLDivElement>,
    id: number,
    handle: string
  ) => {
    e.stopPropagation();
    setResizing({ id, handle });
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  // Render resize handles for single selection
  const renderHandles = (shape: any) => {
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

      // Center edges
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
            onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
            style={{
              position: "absolute",
              left: `${shape.x}px`,
              top: `${shape.y}px`,
              width: `${shape.width}px`,
              height: `${shape.height}px`,
              zIndex: selectedShapeIds.includes(shape.id) ? 20 : 1,
            }}
          >
            {/* Selection box */}
            {selectedShapeIds.includes(shape.id) && (
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
            )}

            {/* Resize handles only if exactly 1 shape is selected */}
            {selectedShapeIds.length === 1 &&
              selectedShapeIds[0] === shape.id &&
              renderHandles(shape)}

            {/* Shape */}
            <div
              className={`${shape.color} text-white flex items-center justify-center rounded shadow w-full h-full`}
              style={{ position: "relative", zIndex: 25 }}
            >
              Shape {shape.id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
