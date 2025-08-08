// // hooks/useBorderSnapping.ts
// import { useMemo } from "react";
// import { Position, Shape } from "../types";

// export function useBorderSnapping(
//   connectingMousePos: Position | null,
//   shapes: Shape[]
// ) {
//   const snapThreshold = 15;

//   const snapResult = useMemo(() => {
//     if (!connectingMousePos) return null;

//     let closest: {
//       shapeId: number;
//       snappedPosition: Position;
//     } | null = null;

//     for (const shape of shapes) {
//       const { x, y, width, height, id } = shape;

//       const borders = {
//         top: { x: connectingMousePos.x, y },
//         bottom: { x: connectingMousePos.x, y: y + height },
//         left: { x: x, y: connectingMousePos.y },
//         right: { x: x + width, y: connectingMousePos.y },
//       };

//       for (const key in borders) {
//         const pos = borders[key as keyof typeof borders];
//         const dx = pos.x - connectingMousePos.x;
//         const dy = pos.y - connectingMousePos.y;
//         const dist = Math.sqrt(dx * dx + dy * dy);

//         if (dist < snapThreshold) {
//           closest = {
//             shapeId: id,
//             snappedPosition: pos,
//           };
//           break;
//         }
//       }

//       if (closest) break;
//     }

//     return closest;
//   }, [connectingMousePos, shapes]);

//   return { snapResult };
// }

// hooks/useBorderSnapping.ts
import { useMemo } from "react";
import type { Position, Shape } from "../types";

type SnapResult = {
  shapeId: number;
  snappedPosition: Position; // world coords
  side: "top" | "right" | "bottom" | "left";
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Snap the pointer (world coords) to the nearest border of any shape.
 * Threshold is applied in *screen pixels*, so it feels consistent across zoom levels.
 */
export function useBorderSnapping(
  connectingMousePos: Position | null,
  shapes: Shape[],
  scale: number, // <-- pass current scale
  excludeShapeId?: number | null // <-- pass source shape id to avoid self-snap
) {
  const snapResult = useMemo<SnapResult | null>(() => {
    if (!connectingMousePos) return null;

    // Pixel-constant threshold (feel free to tweak)
    const thresholdPx = 14;
    let best: ({ distPx: number } & SnapResult) | null = null;

    for (const s of shapes) {
      if (excludeShapeId && s.id === excludeShapeId) continue;

      const left = s.x;
      const right = s.x + s.width;
      const top = s.y;
      const bottom = s.y + s.height;

      // For horizontal sides, clamp X; for vertical sides, clamp Y.
      const candidates: SnapResult[] = [
        {
          shapeId: s.id,
          side: "top",
          snappedPosition: {
            x: clamp(connectingMousePos.x, left, right),
            y: top,
          },
        },
        {
          shapeId: s.id,
          side: "bottom",
          snappedPosition: {
            x: clamp(connectingMousePos.x, left, right),
            y: bottom,
          },
        },
        {
          shapeId: s.id,
          side: "left",
          snappedPosition: {
            x: left,
            y: clamp(connectingMousePos.y, top, bottom),
          },
        },
        {
          shapeId: s.id,
          side: "right",
          snappedPosition: {
            x: right,
            y: clamp(connectingMousePos.y, top, bottom),
          },
        },
      ];

      for (const c of candidates) {
        const dx = c.snappedPosition.x - connectingMousePos.x;
        const dy = c.snappedPosition.y - connectingMousePos.y;
        const distWorld = Math.hypot(dx, dy);
        const distPx = distWorld * scale; // convert world → screen px

        if (distPx <= thresholdPx) {
          if (!best || distPx < best.distPx) {
            best = { distPx, ...c };
          }
        }
      }
    }

    return best
      ? {
          shapeId: best.shapeId,
          snappedPosition: best.snappedPosition,
          side: best.side,
        }
      : null;
  }, [connectingMousePos, shapes, scale, excludeShapeId]);

  return { snapResult };
}
