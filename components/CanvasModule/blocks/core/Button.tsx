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
];
interface ButtonBlockProps extends Omit<ShapeFrameProps, "children" | "shape"> {
  shape: IShape;
  onCommitStyle?: (id: string, patch: Partial<IShape>) => void;
}

export const Button: React.FC<ButtonBlockProps> = (props) => {
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

          {/* Text */}
          <div className="relative">
            <button
              className="px-2 py-1 rounded bg-gray-100 border flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                setOpenPicker(openPicker === "fg" ? null : "fg");
              }}
            >
              <span className="text-gray-500">Text</span>
              <span
                className="w-4 h-4 rounded border grid place-items-center"
                style={{ color: shape.textColor || "#0f172a" }}
              >
                A
              </span>
            </button>
            {openPicker === "fg" && (
              <PalettePopover
                onPick={(c) => {
                  onCommitStyle?.(shape.id, { textColor: c });
                  setOpenPicker(null);
                }}
              />
            )}
          </div>

          {/* Font size */}
          <div className="relative">
            <button
              className="px-2 h-[26px] rounded bg-gray-100 border flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                setOpenPicker(openPicker === "fs" ? null : "fs");
              }}
            >
              <span className="text-gray-500">Size</span>
              <span className="min-w-[2.75rem] px-1 py-0.5 rounded border bg-white text-xs text-gray-700 grid place-items-center">
                {(shape.textSize ?? 14) + "px"}
              </span>
            </button>

            {openPicker === "fs" && (
              <div
                className="absolute z-50 mt-1 w-32 rounded-md border bg-white shadow-lg"
                onClick={(e) => e.stopPropagation()} // keep dropdown open when clicking inside
              >
                <div className="max-h-[550px] overflow-auto py-1">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
                      onClick={() => {
                        onCommitStyle?.(shape.id, { textSize: s });
                        setOpenPicker(null);
                      }}
                    >
                      <span>{s}px</span>
                      <span
                        className={
                          s === (shape.textSize ?? 14)
                            ? "i-checked text-gray-700"
                            : "opacity-0"
                        }
                      >
                        ✓
                      </span>
                    </button>
                  ))}
                </div>

                {/* Custom size */}
                {/* <div className="border-t p-2 flex items-center gap-2">
        <input
          type="number"
          min={6}
          max={256}
          step={1}
          defaultValue={shape.fontSize ?? 14}
          className="w-20 rounded border px-2 py-1 text-sm"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            // Enter to apply
            if (e.key === "Enter") {
              const target = e.target as HTMLInputElement;
              const val = Math.min(256, Math.max(6, Number(target.value) || 14));
              onCommitStyle?.(shape.id, { fontSize: val });
              setOpenPicker(null);
            }
          }}
        />
        <button
          className="ml-auto px-2 py-1 text-sm rounded bg-gray-100 border"
          onClick={(e) => {
            e.stopPropagation();
            const input = (e.currentTarget.parentElement?.querySelector(
              "input[type='number']"
            ) as HTMLInputElement)!;
            const val = Math.min(256, Math.max(6, Number(input.value) || 14));
            onCommitStyle?.(shape.id, { fontSize: val });
            setOpenPicker(null);
          }}
        >
          Apply
        </button>
      </div> */}
              </div>
            )}
          </div>

          {/* Font style */}
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Style</span>
            <button
              className="px-2 py-1 rounded bg-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                onCommitStyle?.(shape.id, {
                  textStyle: "normal",
                  textWeight: "normal",
                });
              }}
            >
              N
            </button>
            <button
              className="px-2 py-1 rounded bg-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                onCommitStyle?.(shape.id, { textWeight: "bold" });
              }}
            >
              <span className="font-bold">B</span>
            </button>
            <button
              className="px-2 py-1 rounded bg-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                onCommitStyle?.(shape.id, { textStyle: "italic" });
              }}
            >
              <span className="italic">I</span>
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
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="w-full h-full px-4 py-1.5 rounded-md border text-sm font-medium truncate flex items-center justify-center"
          style={{
            backgroundColor: shape.color || "#111827",
            color: shape.textColor || "fff",
            borderColor: "rgba(0,0,0,0.2)",
            fontSize: shape.textSize || 14,
            fontStyle: shape.textStyle,
            fontWeight: shape.textWeight,
          }}
        >
          {shape.label ?? "Button"}
        </div>
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
