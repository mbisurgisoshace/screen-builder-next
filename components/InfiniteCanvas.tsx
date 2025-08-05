"use client";
import { useRef, useState, useEffect } from "react";

export default function InfiniteCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // --- Panning ---
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setIsPanning(false);

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPanning, lastMousePos]);

  // --- Zoom with passive:false ---
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();

      const zoomIntensity = 0.001;
      const delta = -e.deltaY * zoomIntensity;

      // Get mouse position relative to the canvas
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Convert screen coords to world coords
      const worldX = (mouseX - position.x) / scale;
      const worldY = (mouseY - position.y) / scale;

      // Update scale
      let newScale = scale + delta;
      newScale = Math.min(Math.max(newScale, 0.1), 4);

      // Adjust position so zoom centers on mouse
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
        {/* Default shape */}
        <div
          style={{
            position: "absolute",
            left: "500px",
            top: "500px",
          }}
          className="w-40 h-28 bg-blue-500 text-white flex items-center justify-center rounded shadow"
        >
          Default Shape
        </div>
      </div>
    </div>
  );
}
