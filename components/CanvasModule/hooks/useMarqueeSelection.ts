import { useEffect, useState } from "react";

interface Position {
  x: number;
  y: number;
}

interface Shape {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Marquee {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface UseMarqueeSelectionParams {
  scale: number;
  position: Position;
  shapes: Shape[];
  setSelectedShapeIds: (ids: number[]) => void;
}

export function useMarqueeSelection({
  scale,
  position,
  shapes,
  setSelectedShapeIds,
}: UseMarqueeSelectionParams) {
  const [marquee, setMarquee] = useState<Marquee | null>(null);
  const [lastMousePos, setLastMousePos] = useState<Position>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (marquee) {
        const startX = (lastMousePos.x - position.x) / scale;
        const startY = (lastMousePos.y - position.y) / scale;
        const currentX = (e.clientX - position.x) / scale;
        const currentY = (e.clientY - position.y) / scale;

        setMarquee({
          x: Math.min(startX, currentX),
          y: Math.min(startY, currentY),
          w: Math.abs(currentX - startX),
          h: Math.abs(currentY - startY),
        });
      }
    };

    const handleMouseUp = () => {
      if (marquee) {
        const selected = shapes
          .filter(
            (s) =>
              s.x >= marquee.x &&
              s.y >= marquee.y &&
              s.x + s.width <= marquee.x + marquee.w &&
              s.y + s.height <= marquee.y + marquee.h
          )
          .map((s) => s.id);
        setSelectedShapeIds(selected);
        setMarquee(null);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [marquee, lastMousePos, position, scale, shapes, setSelectedShapeIds]);

  const startMarquee = (clientX: number, clientY: number) => {
    const startX = (clientX - position.x) / scale;
    const startY = (clientY - position.y) / scale;
    setMarquee({ x: startX, y: startY, w: 0, h: 0 });
    setLastMousePos({ x: clientX, y: clientY });
  };

  return { marquee, startMarquee, setLastMousePos };
}
