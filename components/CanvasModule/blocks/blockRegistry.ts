import { ShapeComponent } from "../types";

import { Rect } from "./core/Rect";
import { Text } from "./core/Text";
import { Ellipse } from "./core/Ellipse";

// Registry maps type to corresponding component
export const shapeRegistry: Record<string, ShapeComponent> = {
  rect: Rect,
  text: Text,
  ellipse: Ellipse,
};
