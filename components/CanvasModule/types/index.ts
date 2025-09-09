export type ShapeType =
  | "card"
  | "rect"
  | "text"
  | "image"
  | "table"
  | "ellipse"
  | "question"
  | "interview"
  | "feature_idea"
  | "question_answer";

export type CardType =
  | "assumption_card"
  | "interview_card"
  | "solution_card"
  | "problem_statement_card";

export type Kind = "image" | "video" | "pdf" | "file";

export interface Shape {
  x: number;
  y: number;
  id: string;
  color: string;
  width: number;
  text?: string;
  height: number;
  type: ShapeType;
  subtype?: CardType;

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

  // attachments
  attachments?: Attachment[];

  // feature idea
  featureIdeaTags?: string[];

  // question
  questionTitle?: string;
}

export type Attachment = {
  id: string;
  kind: Kind;
  name: string;
  mime: string;
  url?: string;
  preview?: string; // small base64 preview for collaborators
  uploading?: boolean;
  progress?: number; // 0..1
  createdAt: number;
  size?: number;
  ext?: string;
};

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
  interactive?: boolean;
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
