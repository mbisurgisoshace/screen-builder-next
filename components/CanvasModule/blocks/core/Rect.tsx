// import { renderConnectorPoints } from "../../Shape";
// import { ShapeComponentProps } from "../../types";

// export function Rect(props: ShapeComponentProps) {
//   const {
//     shape,
//     isSelected,
//     selectedCount,
//     onMouseDown,
//     renderHandles,
//     onConnectorMouseDown,
//   } = props;
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
//       }}
//       className={`absolute ${shape.color} ${
//         isSelected && selectedCount === 1 ? "ring-2 ring-blue-500" : ""
//       }`}
//     >
//       {isSelected && selectedCount === 1 && (
//         <>
//           {renderHandles(shape)}
//           {onConnectorMouseDown &&
//             renderConnectorPoints(shape.id, onConnectorMouseDown)}
//         </>
//       )}
//     </div>
//   );
// }

"use client";
import React from "react";
import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";

interface RectBlockProps extends Omit<ShapeFrameProps, "children" | "shape"> {
  shape: IShape;
}

export const Rect: React.FC<RectBlockProps> = (props) => {
  const { shape } = props;
  return (
    <ShapeFrame
      {...props}
      resizable={true}
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      <div
        className={`${shape.color} w-full h-full rounded shadow`}
        style={{ borderRadius: 6 }}
      />
    </ShapeFrame>
  );
};
