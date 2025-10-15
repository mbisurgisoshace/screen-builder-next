"use client";
import * as React from "react";
import type { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";

interface ButtonBlockProps extends Omit<ShapeFrameProps, "children" | "shape"> {
  shape: IShape;
  onCommitStyle?: (id: string, patch: Partial<IShape>) => void;
}

export const Button: React.FC<ButtonBlockProps> = (props) => {
  const { shape } = props;
  return (
    <ShapeFrame
      {...props}
      resizable={true}
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      <div
        className="w-full flex items-center justify-center"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="w-full px-4 py-1.5 rounded-md border text-sm font-medium truncate text-center"
          style={{
            background: "#111827",
            color: "#fff",
            borderColor: "rgba(0,0,0,0.2)",
          }}
        >
          {shape.label ?? "Button"}
        </div>
      </div>
    </ShapeFrame>
  );
};
