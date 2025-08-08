// hooks/useBorderSnapping.ts
import { useMemo } from "react";
import { Position, Shape } from "../types";

export function useBorderSnapping(
  connectingMousePos: Position | null,
  shapes: Shape[]
) {
  const snapThreshold = 15;

  const snapResult = useMemo(() => {
    if (!connectingMousePos) return null;

    let closest: {
      shapeId: number;
      snappedPosition: Position;
    } | null = null;

    for (const shape of shapes) {
      const { x, y, width, height, id } = shape;

      const borders = {
        top: { x: connectingMousePos.x, y },
        bottom: { x: connectingMousePos.x, y: y + height },
        left: { x: x, y: connectingMousePos.y },
        right: { x: x + width, y: connectingMousePos.y },
      };

      for (const key in borders) {
        const pos = borders[key as keyof typeof borders];
        const dx = pos.x - connectingMousePos.x;
        const dy = pos.y - connectingMousePos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < snapThreshold) {
          closest = {
            shapeId: id,
            snappedPosition: pos,
          };
          break;
        }
      }

      if (closest) break;
    }

    return closest;
  }, [connectingMousePos, shapes]);

  return { snapResult };
}
