import type { LayoutGridColumns } from "../types";

export interface ColumnEdges {
  leftEdges: number[]; // x positions of left edges
  rightEdges: number[]; // x positions of right edges
}

/**
 * Compute the x positions of column left/right edges in screen-local coords.
 */
export function computeColumnEdges(
  width: number,
  grid: LayoutGridColumns
): ColumnEdges | null {
  const { count, gutter, margin } = grid;

  if (count <= 0 || width <= 0) return null;

  const contentWidth = width - margin * 2;
  if (contentWidth <= 0) return null;

  const totalGutterWidth = gutter * (count - 1);
  const columnWidth = (contentWidth - totalGutterWidth) / count;
  if (columnWidth <= 0) return null;

  const leftEdges: number[] = [];
  const rightEdges: number[] = [];

  for (let i = 0; i < count; i++) {
    const left = margin + i * (columnWidth + gutter);
    const right = left + columnWidth;

    leftEdges.push(left);
    rightEdges.push(right);
  }

  return { leftEdges, rightEdges };
}

const DEFAULT_SNAP_THRESHOLD = 8; // px in screen-local coords

function findClosestEdge(
  value: number,
  edges: number[]
): { snapped: number; distance: number } | null {
  if (!edges.length) return null;
  let best = edges[0];
  let bestDist = Math.abs(value - best);

  for (let i = 1; i < edges.length; i++) {
    const d = Math.abs(value - edges[i]);
    if (d < bestDist) {
      bestDist = d;
      best = edges[i];
    }
  }

  return { snapped: best, distance: bestDist };
}

/**
 * Snap a left x position to the nearest column edge (left or right),
 * if within threshold. Otherwise return original x.
 */
export function snapXToGridColumns(
  x: number,
  screenWidth: number,
  grid: LayoutGridColumns,
  threshold: number = DEFAULT_SNAP_THRESHOLD
): number {
  if (!grid.enabled || !grid.snapToColumns) return x;

  const edges = computeColumnEdges(screenWidth, grid);
  if (!edges) return x;

  const allEdges = [...edges.leftEdges, ...edges.rightEdges];
  const closest = findClosestEdge(x, allEdges);
  if (!closest || closest.distance > threshold) return x;

  return closest.snapped;
}

/**
 * Snap a shape width by snapping its right edge to nearest column edge.
 * Returns new width (or original if no snap).
 */
export function snapWidthToGridColumns(
  x: number,
  width: number,
  screenWidth: number,
  grid: LayoutGridColumns,
  threshold: number = DEFAULT_SNAP_THRESHOLD
): number {
  if (!grid.enabled || !grid.snapToColumns) return width;

  const edges = computeColumnEdges(screenWidth, grid);
  if (!edges) return width;

  const right = x + width;
  const allEdges = [...edges.leftEdges, ...edges.rightEdges];
  const closest = findClosestEdge(right, allEdges);
  if (!closest || closest.distance > threshold) return width;

  const snappedRight = closest.snapped;
  const newWidth = snappedRight - x;
  return newWidth > 0 ? newWidth : width;
}
