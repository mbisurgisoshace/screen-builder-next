export type ShapeType = "rect" | "ellipse" | "text";

export interface Shape {
  x: number;
  y: number;
  id: number;
  color: string;
  width: number;
  text?: string;
  type: ShapeType;
  height: number;
}

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
