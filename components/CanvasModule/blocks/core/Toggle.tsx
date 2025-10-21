"use client";
import * as React from "react";
import type { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";
import { useRegisterToolbarExtras } from "../toolbar/toolbarExtrasStore";

interface Props extends Omit<ShapeFrameProps, "children" | "shape"> {
  shape: IShape; // uses: label, toggleOn, textColor, accentColor
  onCommitStyle?: (id: string, patch: Partial<IShape>) => void;
}

export const ToggleSwitch: React.FC<Props> = (props) => {
  const { shape, onCommitStyle } = props;

  const label = shape.label ?? "Detailed";
  const on = Boolean(shape.toggleOn);
  const textColor = shape.textColor ?? "#0f172a";
  const accent = shape.accentColor ?? "#1F2A44"; // deep navy like the mock

  // Toolbar: quick On/Off + color pick (compact)
  useRegisterToolbarExtras(
    shape.id,
    () => (
      <div
        className="flex items-center gap-2 z-50"
        data-nodrag="true"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          className="px-2 py-1 rounded border bg-white text-xs"
          onClick={() => onCommitStyle?.(shape.id, { toggleOn: !on })}
        >
          {on ? "Turn Off" : "Turn On"}
        </button>
        <button
          className="px-2 py-1 rounded border bg-white text-xs"
          onClick={() =>
            onCommitStyle?.(shape.id, {
              textColor: textColor === "#0f172a" ? "#111827" : "#0f172a",
            })
          }
        >
          Text Color
        </button>
      </div>
    ),
    [shape.id, on, textColor, onCommitStyle]
  );

  return (
    <ShapeFrame
      {...props}
      resizable={true}
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      {/* Inner visuals are non-interactive so the frame handles drag/resize */}
      <div
        className="w-full h-full flex items-center gap-3 px-2"
        style={{ pointerEvents: "none" }}
      >
        {/* Label */}
        <span
          className="font-medium truncate"
          style={{ color: textColor, fontSize: shape.textSize ?? 14 }}
        >
          {label}
        </span>

        {/* Switch */}
        <div
          className="relative flex items-center"
          style={{
            width: 52,
            height: 28,
            borderRadius: 999,
            background: on ? accent : "rgba(15, 23, 42, 0.25)",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
          }}
        >
          <div
            className="absolute ml-1 mr-1"
            style={{
              width: 22,
              height: 22,
              borderRadius: "999px",
              background: "#ffffff",
              transform: `translateX(${on ? 22 : 0}px)`,
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)",
            }}
          />
        </div>
      </div>
    </ShapeFrame>
  );
};
