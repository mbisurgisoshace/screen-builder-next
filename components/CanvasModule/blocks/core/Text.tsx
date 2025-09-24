"use client";
import React, { useEffect, useRef, useState } from "react";
import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";
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

interface TextBlockProps extends Omit<ShapeFrameProps, "children" | "shape"> {
  shape: IShape;
  onCommitText?: (id: IShape["id"], text: string) => void;
  onCommitStyle?: (id: string, patch: Partial<IShape>) => void;
}

export const Text: React.FC<TextBlockProps> = (props) => {
  const { shape, onCommitText, onCommitStyle } = props;

  const [openPicker, setOpenPicker] = useState<
    null | "bg" | "fg" | "size" | "fs"
  >(null);

  const wrapRef = React.useRef<HTMLDivElement>(null);

  const SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36];

  useRegisterToolbarExtras(
    shape.id,
    () => (
      <>
        <div ref={wrapRef} className="flex items-center gap-2">
          {/* BG */}
          {/* <div className="relative">
            <button
              className="px-2 py-1 rounded bg-gray-100 border flex items-center gap-1"
              onClick={(e) => {
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
          </div> */}

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
                <div className="max-h-56 overflow-auto py-1">
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

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(shape.text ?? "");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(shape.text ?? "");
  }, [shape.text, editing]);

  const enterEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  };

  const commit = () => {
    const value = draft.trim();
    onCommitText?.(shape.id, value);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(shape.text ?? "");
    setEditing(false);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    // Enter commits (unless Shift+Enter for newline). Esc cancels.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  // Prevent dragging/select/marquee while editing inside the frame
  const stopAll: React.MouseEventHandler = (e) => e.stopPropagation();

  const [isEditing, setIsEditing] = React.useState(false);
  const [text, setText] = React.useState<string>(shape.text ?? "");
  const taRef = React.useRef<HTMLTextAreaElement>(null);
  const beginEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    requestAnimationFrame(() => {
      taRef.current?.focus();
      // put caret at end
      const el = taRef.current!;
      const len = el.value.length;
      el.setSelectionRange(len, len);
    });
  };

  const commitText = () => {
    if ((shape.text ?? "") !== text) onCommitStyle?.(shape.id, { text });
  };

  return (
    <ShapeFrame
      {...props}
      minHeight={30}
      showConnectors={props.isSelected && props.selectedCount === 1}
      resizable /* connectors for text? keep true or set false */
      onMouseDown={editing ? stopAll : props.onMouseDown}
    >
      <div
        onDoubleClick={beginEdit}
        className={` w-full bg-transparent`}
        style={{
          //borderRadius: 6,
          //backgroundColor: shape.color || "#EAFBE3",
          height: shape.height,
        }}
      >
        {/* View mode: centered display (no caret) */}
        {!isEditing && (
          <div
            className="absolute inset-0 flex flex-row items-center justify-center p-2 text-center pointer-events-none whitespace-pre-wrap break-words flex-wrap"
            style={{
              color: shape.textColor || "#0f172a",
              lineHeight: 1.25,
              fontSize: shape.textSize || 14,
              fontStyle: shape.textStyle,
              fontWeight: shape.textWeight,
            }}
          >
            <span>{text || ""}</span>
          </div>
        )}

        {/* Edit mode: textarea overlay (you can tweak centering) */}
        {isEditing && (
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => {
              commitText();
              setIsEditing(false);
            }}
            data-nodrag="true"
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Add text…"
            className="absolute inset-0 w-full h-full bg-transparent outline-none resize-none p-2 text-sm"
            style={{
              // You can start centering here:
              textAlign: "center",
              lineHeight: 1.25,
              color: shape.textColor || "#0f172a",
              fontSize: shape.textSize || 14,
              fontStyle: shape.textStyle,
              fontWeight: shape.textWeight,
              // For vertical centering with textarea, consider measuring content height and setting paddingTop.
            }}
          />
        )}
      </div>
      {/* <div className="w-full h-full flex items-center justify-center text-black select-none">
        {shape.text ?? "Text"}
      </div> */}
      {/* {editing ? (
        <textarea
          ref={textareaRef}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          className="w-full h-full bg-transparent outline-none resize-none p-2 text-black"
          style={{
            // Make sure text starts at top-left like Miro text blocks
            lineHeight: 1.2,
            whiteSpace: "pre-wrap",
            overflow: "hidden",
            color: shape.textColor || "#0f172a",
            fontSize: shape.textSize || 14,
            fontStyle: shape.textStyle,
          }}
        />
      ) : (
        <div
          style={{
            color: shape.textColor || "#0f172a",
            fontSize: shape.textSize || 14,
            fontStyle: shape.textStyle,
          }}
          className="w-full h-full flex items-start justify-start p-2 text-black select-none cursor-text"
          onDoubleClick={enterEdit}
        >
          {shape.text && shape.text.length > 0 ? shape.text : "Text"}
        </div>
      )} */}
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
