"use client";
import React, { useEffect, useRef, useState } from "react";
import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";

interface TextBlockProps extends Omit<ShapeFrameProps, "children" | "shape"> {
  shape: IShape;
  onCommitText?: (id: IShape["id"], text: string) => void;
}

export const Text: React.FC<TextBlockProps> = (props) => {
  const { shape, onCommitText } = props;

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

  return (
    <ShapeFrame
      {...props}
      showConnectors={props.isSelected && props.selectedCount === 1}
      resizable /* connectors for text? keep true or set false */
      onMouseDown={editing ? stopAll : props.onMouseDown}
    >
      {/* <div className="w-full h-full flex items-center justify-center text-black select-none">
        {shape.text ?? "Text"}
      </div> */}
      {editing ? (
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
          }}
        />
      ) : (
        <div
          className="w-full h-full flex items-start justify-start p-2 text-black select-none cursor-text"
          onDoubleClick={enterEdit}
        >
          {shape.text && shape.text.length > 0 ? shape.text : "Text"}
        </div>
      )}
    </ShapeFrame>
  );
};
