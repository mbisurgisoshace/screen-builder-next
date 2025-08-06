import { useRef, useState, useEffect } from "react";

import { Position } from "../types";

export function useCanvasTransform() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Zoom
      if (e.ctrlKey && e.deltaMode === 0) {
        e.preventDefault();
        const zoomIntensity = 0.01;
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
        return;
      }

      // Pan with trackpad
      if (
        !e.ctrlKey &&
        e.deltaMode === 0 &&
        (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) > 0)
      ) {
        e.preventDefault();
        setPosition((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
        return;
      }

      // Zoom with mouse wheel
      if (!e.ctrlKey) {
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
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [position, scale]);

  return {
    canvasRef,
    position,
    scale,
    setPosition,
    setScale,
  };
}
