import { ShapeComponent } from "../types";

import { Rect } from "./core/Rect";
import { Text } from "./core/Text";
import { Image } from "./core/Image";
import { Ellipse } from "./core/Ellipse";
import { Interview } from "./custom/Interview";
import { Table } from "./core/Table";

// Registry maps type to corresponding component
export const shapeRegistry: Record<string, ShapeComponent> = {
  rect: Rect,
  text: Text,
  image: Image,
  table: Table,
  ellipse: Ellipse,
  interview: Interview,
};
