"use client";
import React from "react";
import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";

type Props = Omit<ShapeFrameProps, "children" | "shape"> & { shape: IShape };

export const Image: React.FC<Props> = (props) => {
  const { shape } = props;
  console.log("Rendering Image shape", shape);

  return (
    <ShapeFrame
      {...props}
      resizable={true}
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      <div className="w-full bg-white rounded-xl shadow overflow-hidden relative">
        {/* subtle checkerboard background */}
        <div
          className="absolute inset-0"
          style={{
            // backgroundImage:
            //   "linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
          }}
        />
        {shape.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shape.src}
            alt=""
            draggable={false}
            width={shape.width}
            height={shape.height}
            //className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
            Drop an image
          </div>
        )}
      </div>
    </ShapeFrame>
  );
};
