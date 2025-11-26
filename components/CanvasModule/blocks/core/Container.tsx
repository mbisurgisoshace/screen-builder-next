"use client";
import * as React from "react";
import type { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";
import { useState } from "react";
import { useRegisterToolbarExtras } from "../toolbar/toolbarExtrasStore";

const PALETTE = [
  "#ffffff",
  "#f8fafc",
  "#fee2e2",
  "#ffedd5",
  "#fef3c7",
  "#dcfce7",
  "#dbeafe",
  "#e9d5ff",
  "#fce7f3",
  "#000000",
  "#EBEEFF",
  "#F0F1F8",
  "#FFE3EA",
  "#E7F5EA",
  "#F9F9F9",
  "#CECECE",
];
interface ContainerBlockProps
  extends Omit<ShapeFrameProps, "children" | "shape"> {
  shape: IShape;
  onCommitStyle?: (id: string, patch: Partial<IShape>) => void;
}

export const Container: React.FC<ContainerBlockProps> = (props) => {
  const { shape, onCommitStyle } = props;

  const [openPicker, setOpenPicker] = useState<
    null | "bg" | "fg" | "size" | "fs"
  >(null);

  const wrapRef = React.useRef<HTMLDivElement>(null);

  const SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 60, 80, 100, 120];

  useRegisterToolbarExtras(
    shape.id,
    () => (
      <>
        <div ref={wrapRef} className="flex items-center gap-2 z-100">
          {/* BG */}
          <div className="relative">
            <button
              className="px-2 py-1 rounded bg-gray-100 border flex items-center gap-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpenPicker(openPicker === "bg" ? null : "bg");
              }}
            >
              <span className="text-gray-500">BG</span>
              <span
                className="w-4 h-4 rounded border"
                style={{
                  backgroundColor: shape.color || "#ffffff",
                }}
              />
            </button>
            {openPicker === "bg" && (
              <PalettePopover
                onPick={(c) => {
                  onCommitStyle?.(shape.id, { color: c });
                  setOpenPicker(null);
                }}
              />
            )}
          </div>

          {/* Border Radius */}
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Radius</span>
            <button
              className="px-2 py-1 rounded bg-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                onCommitStyle?.(shape.id, {
                  borderRadius: 0,
                });
              }}
            >
              None
            </button>
            <button
              className="px-2 py-1 rounded bg-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                onCommitStyle?.(shape.id, { borderRadius: 5 });
              }}
            >
              <span className="">Small</span>
            </button>
            <button
              className="px-2 py-1 rounded bg-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                onCommitStyle?.(shape.id, { borderRadius: 15 });
              }}
            >
              <span className="">Medium</span>
            </button>
            <button
              className="px-2 py-1 rounded bg-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                onCommitStyle?.(shape.id, { borderRadius: 100 });
              }}
            >
              <span className="">Rounded</span>
            </button>
          </div>
        </div>
      </>
    ),
    [
      shape.id,
      shape.color,
      openPicker,
      shape.textColor,
      shape.textStyle,
      shape.textSize,
      onCommitStyle,
    ]
  );

  return (
    <ShapeFrame
      {...props}
      resizable={true}
      showTagsToolbar={false}
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      <div
        className="w-full h-full flex items-center justify-center "
        style={{ pointerEvents: "none" }}
      >
        <div
          className="w-full h-full px-4 py-1.5 text-sm font-medium truncate flex items-center justify-center border border-[#E7E9F4]"
          style={{
            backgroundColor: shape.color || "#111827",
            color: shape.textColor || "fff",
            borderColor: "rgba(0,0,0,0.2)",
            fontSize: shape.textSize || 14,
            fontStyle: shape.textStyle,
            fontWeight: shape.textWeight,
            borderRadius: shape.borderRadius || 4,
          }}
        ></div>
      </div>
    </ShapeFrame>
  );
};

function PalettePopover({
  onPick,
  selectedHex,
}: {
  onPick: (c: string) => void;
  selectedHex?: string;
}) {
  return (
    <div
      className="absolute w-max top-full left-0 mt-1 z-50 p-2 bg-white border rounded-xl shadow grid grid-cols-5 gap-1"
      data-nodrag="true"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {PALETTE.map((c) => (
        <button
          key={c}
          title={c}
          className={`w-6 h-6 rounded border hover:scale-105 transition ${
            selectedHex === c ? "ring-2 ring-blue-500" : ""
          }`}
          style={{ backgroundColor: c }}
          onClick={(e) => {
            e.stopPropagation();
            onPick(c);
          }}
        />
      ))}
    </div>
  );
}
