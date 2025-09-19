"use client";
import React from "react";
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
interface EllipseBlockProps
  extends Omit<ShapeFrameProps, "children" | "shape"> {
  shape: IShape;
  onCommitStyle?: (id: string, patch: Partial<IShape>) => void;
}

export const Ellipse: React.FC<EllipseBlockProps> = (props) => {
  const { shape, onCommitStyle } = props;

  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  useRegisterToolbarExtras(
    shape.id,
    () => (
      <>
        <div ref={wrapRef} className="flex items-center gap-2">
          <div className="relative">
            <button
              className="px-2 py-1 rounded bg-gray-100 border flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((o) => !o);
              }}
            >
              <span className="text-gray-500">BG</span>
              <span
                className="w-4 h-4 rounded border"
                style={{
                  backgroundColor: shape.color ? shape.color : "#ffffff",
                }}
              />
            </button>
            {open && (
              <PalettePopover
                onPick={(hex) => {
                  onCommitStyle?.(shape.id, { color: hex });
                  setOpen(false);
                }}
              />
            )}
          </div>
        </div>
      </>
    ),
    [shape.id, shape.color, open]
  );

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  // ---------- Text: textarea editor on double-click ----------
  const [isEditing, setIsEditing] = React.useState(false);
  const [text, setText] = React.useState<string>(shape.text ?? "");
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  // sync external text when not editing (undo/redo, remote)
  React.useEffect(() => {
    if (!isEditing) setText(shape.text ?? "");
  }, [shape.text, isEditing]);

  // close editor if deselected
  React.useEffect(() => {
    if (!(props.isSelected && props.selectedCount === 1)) setIsEditing(false);
  }, [props.isSelected, props.selectedCount]);

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
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      <div
        onDoubleClick={beginEdit}
        className={` w-full rounded-full shadow`}
        style={{
          backgroundColor: shape.color || "#EAFBE3",
          height: shape.height,
        }}
      >
        {/* View mode: centered display (no caret) */}
        {!isEditing && (
          <div
            className="absolute inset-0 flex items-center justify-center p-2 text-center pointer-events-none whitespace-pre-wrap break-words"
            style={{ color: "#0f172a", lineHeight: 1.25 }}
          >
            {text || ""}
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
              color: "#0f172a",
              // For vertical centering with textarea, consider measuring content height and setting paddingTop.
            }}
          />
        )}
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
