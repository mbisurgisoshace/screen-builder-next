import { RefObject, useEffect, useState } from "react";

import { Marquee, Position, Shape } from "../types";

interface UseMarqueeSelectionParams {
  scale: number;
  position: Position;
  shapes: Shape[];
  canvasRef: RefObject<HTMLDivElement | null>;
  setSelectedShapeIds: (ids: string[]) => void;
  setMarquee?: (marquee: Marquee | null) => void;
}

export function useMarqueeSelection({
  scale,
  shapes,
  position,
  canvasRef,
  setSelectedShapeIds,
  setMarquee: externalSetMarquee,
}: UseMarqueeSelectionParams) {
  const [marquee, internalSetMarquee] = useState<Marquee | null>(null);
  const [lastMousePos, setLastMousePos] = useState<Position>({ x: 0, y: 0 });

  const setMarquee = externalSetMarquee || internalSetMarquee;

  const clientToWorld = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const offX = rect ? clientX - rect.left : clientX;
    const offY = rect ? clientY - rect.top : clientY;
    return {
      x: (offX - position.x) / scale,
      y: (offY - position.y) / scale,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (marquee) {
        // world start (from stored client pos)
        const start = clientToWorld(lastMousePos.x, lastMousePos.y);
        // world current
        const curr = clientToWorld(e.clientX, e.clientY);

        setMarquee({
          x: Math.min(start.x, curr.x),
          y: Math.min(start.y, curr.y),
          w: Math.abs(curr.x - start.x),
          h: Math.abs(curr.y - start.y),
        });
        // const startX = (lastMousePos.x - position.x) / scale;
        // const startY = (lastMousePos.y - position.y) / scale;
        // const currentX = (e.clientX - position.x) / scale;
        // const currentY = (e.clientY - position.y) / scale;

        // setMarquee({
        //   x: Math.min(startX, currentX),
        //   y: Math.min(startY, currentY),
        //   w: Math.abs(currentX - startX),
        //   h: Math.abs(currentY - startY),
        // });
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
