// import { renderConnectorPoints } from "../../Shape";
// import { ShapeComponentProps } from "../../types";

// export function Text({
//   shape,
//   isSelected,
//   selectedCount,
//   onMouseDown,
//   renderHandles,
// }: ShapeComponentProps) {
//   return (
//     <div
//       onMouseDown={onMouseDown}
//       data-shapeid={shape.id}
//       style={{
//         position: "absolute",
//         left: shape.x,
//         top: shape.y,
//         width: shape.width,
//         height: shape.height,
//         padding: "4px",
//         whiteSpace: "pre-wrap",
//       }}
//       className={`absolute bg-white border ${
//         isSelected && selectedCount === 1 ? "ring-2 ring-blue-500" : ""
//       }`}
//     >
//       {shape.text || "Text"}
//       {isSelected && selectedCount === 1 && (
//         <>
//           {renderHandles(shape)}
//           {renderConnectorPoints(shape)}
//         </>
//       )}
//     </div>
//   );
// }

"use client";
import React from "react";
import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";

interface TextBlockProps extends Omit<ShapeFrameProps, "children" | "shape"> {
  shape: IShape;
}

export const Text: React.FC<TextBlockProps> = (props) => {
  const { shape } = props;
  return (
    <ShapeFrame
      {...props}
      showConnectors={props.isSelected && props.selectedCount === 1}
      resizable /* connectors for text? keep true or set false */
    >
      <div className="w-full h-full flex items-center justify-center text-black select-none">
        {shape.text ?? "Text"}
      </div>
    </ShapeFrame>
  );
};
