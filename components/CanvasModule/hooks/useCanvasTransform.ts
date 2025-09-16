import { useRef, useState, useEffect, useCallback } from "react";
import type { Position } from "../types";

type Anchor = "center" | { screenX: number; screenY: number };

export function useCanvasTransform(
  opts: { minScale?: number; maxScale?: number; zoomStep?: number } = {}
) {
  const { minScale = 0.1, maxScale = 4, zoomStep = 1.1 } = opts;

  const canvasRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const clamp = useCallback(
    (s: number) => Math.min(Math.max(s, minScale), maxScale),
    [minScale, maxScale]
  );

  const getCanvasCenter = useCallback(() => {
    const el = canvasRef.current!;
    const r = el.getBoundingClientRect();
    return { screenX: r.left + r.width / 2, screenY: r.top + r.height / 2 };
  }, []);

  const zoomAtScreenPoint = useCallback(
    (nextScale: number, screenX: number, screenY: number) => {
      const ns = clamp(nextScale);
      const worldX = (screenX - position.x) / scale;
      const worldY = (screenY - position.y) / scale;
      // update both together so the anchor stays fixed under the pointer
      setScale(ns);
      setPosition({
        x: screenX - worldX * ns,
        y: screenY - worldY * ns,
      });
    },
    [position.x, position.y, scale, clamp]
  );

  const resolveAnchor = useCallback(
    (anchor?: Anchor) => {
      if (!anchor || anchor === "center") return getCanvasCenter();
      return anchor;
    },
    [getCanvasCenter]
  );

  const zoomTo = useCallback(
    (nextScale: number, anchor?: Anchor) => {
      const { screenX, screenY } = resolveAnchor(anchor);
      zoomAtScreenPoint(nextScale, screenX, screenY);
    },
    [resolveAnchor, zoomAtScreenPoint]
  );

  const zoomBy = useCallback(
    (factor: number, anchor?: Anchor) => {
      zoomTo(scale * factor, anchor);
    },
    [scale, zoomTo]
  );

  const zoomIn = useCallback(
    () => zoomBy(zoomStep, "center"),
    [zoomBy, zoomStep]
  );
  const zoomOut = useCallback(
    () => zoomBy(1 / zoomStep, "center"),
    [zoomBy, zoomStep]
  );

  const panBy = useCallback((dx: number, dy: number) => {
    setPosition((p) => ({ x: p.x + dx, y: p.y + dy }));
  }, []);

  const resetView = useCallback(() => {
    // center world origin under canvas center
    const { screenX, screenY } = getCanvasCenter();
    setScale(1);
    setPosition({ x: screenX, y: screenY });
  }, [getCanvasCenter]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent page scroll—canvas handles pan/zoom
      e.preventDefault();

      // Trackpad pan (no ctrlKey, has pixel deltas)
      if (!e.ctrlKey && e.deltaMode === 0 && (e.deltaX || e.deltaY)) {
        setPosition((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
        return;
      }

      // Zoom (mouse wheel or ctrl+trackpad pinch)
      const isPinch = e.ctrlKey && e.deltaMode === 0;
      const intensity = isPinch ? 0.01 : 0.001;
      const targetScale = clamp(scale - e.deltaY * intensity);
      zoomAtScreenPoint(targetScale, e.clientX, e.clientY);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [scale, clamp, zoomAtScreenPoint]);

  return {
    canvasRef,
    position,
    scale,
    setPosition,
    setScale,
    // helpers
    zoomIn,
    zoomOut,
    zoomBy,
    zoomTo,
    zoomAtScreenPoint,
    panBy,
    resetView,
    minScale,
    maxScale,
  };
}
