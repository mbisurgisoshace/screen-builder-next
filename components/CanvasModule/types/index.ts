export type ShapeType = "rect" | "ellipse" | "text";

export interface Shape {
  x: number;
  y: number;
  id: number;
  color: string;
  width: number;
  text?: string;
  height: number;
  type: ShapeType;
}

export type ShapeComponentProps = {
  shape: Shape;
  isSelected: boolean;
  selectedCount: number;
  renderHandles: (shape: Shape) => React.ReactNode;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onConnectorMouseDown?: (
    e: React.MouseEvent,
    shapeId: number,
    direction: "top" | "right" | "bottom" | "left"
  ) => void;
};

export type ShapeComponent = React.FC<ShapeComponentProps>;

export interface Position {
  x: number;
  y: number;
}

export interface Marquee {
  x: number;
  y: number;
  w: number;
  h: number;
}
