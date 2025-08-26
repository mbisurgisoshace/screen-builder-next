export type ShapeType =
  | "rect"
  | "text"
  | "image"
  | "table"
  | "ellipse"
  | "question"
  | "interview"
  | "feature_idea"
  | "question_answer";

export interface Shape {
  x: number;
  y: number;
  id: string;
  color: string;
  width: number;
  text?: string;
  height: number;
  type: ShapeType;

  // interview block
  draftRaw?: string;
  images?: string[];

  // image block
  src?: string;
  keepAspect?: boolean;

  // table block
  tableRows?: number;
  tableCols?: number;
  tableData?: string[][];
  tableBg?: string[][];
  tableFont?: ("normal" | "bold" | "italic")[][];
  tableFontColor?: string[][];
  tableFontSize?: number[][];

  // tags
  tags?: string[];

  // feature idea
  featureIdeaTags?: string[];
}

export type ShapeComponentProps = {
  shape: Shape;
  isSelected: boolean;
  selectedCount: number;
  // renderHandles: (shape: Shape) => React.ReactNode;
  onResizeStart: (
    e: React.MouseEvent<HTMLDivElement>,
    id: string,
    handle: string
  ) => void;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onConnectorMouseDown?: (
    e: React.MouseEvent,
    shapeId: string,
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
