import type { Shape } from "../types";

export function forEachShape(
  root: Shape,
  fn: (shape: Shape, parent: Shape | null) => void
) {
  const visit = (shape: Shape, parent: Shape | null) => {
    fn(shape, parent);
    shape.children?.forEach((child) => visit(child, shape));
  };
  visit(root, null);
}

export function findShapeWithParent(
  root: Shape,
  predicate: (shape: Shape) => boolean
): { shape: Shape; parent: Shape | null } | null {
  let result = null;
  forEachShape(root, (shape, parent) => {
    if (!result && predicate(shape)) {
      result = { shape, parent };
    }
  });
  return result;
}

export function isContainerShape(shape: Shape): boolean {
  return shape.type === "screen" || shape.type === "card";
  // más adelante: "frame", "group", "component", etc.
}
