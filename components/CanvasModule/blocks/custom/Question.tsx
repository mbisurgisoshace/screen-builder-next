"use client";
import dynamic from "next/dynamic";
import { EllipsisIcon, MicIcon } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorState, convertFromRaw, convertToRaw } from "draft-js";

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";
import { useValueProp } from "@/app/(auth)/questions/_components/ValuePropProvider";

type QuestionProps = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  onCommitInterview?: (id: string, patch: Partial<IShape>) => void;
};

// SSR-safe import (react-draft-wysiwyg touches window)
const RteEditor = dynamic(
  () => import("react-draft-wysiwyg").then((m) => m.Editor),
  { ssr: false }
);

export const Question: React.FC<QuestionProps> = (props) => {
  const { shape, onCommitInterview } = props;

  const fallbackTitle = "Double click to edit the question.";
  const title = (shape as any).questionTitle ?? fallbackTitle;

  const { valuePropData } = useValueProp();

  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);

  const commit = (patch: Partial<IShape>) => {
    onCommitInterview?.(shape.id, patch);
  };

  useEffect(() => {
    if (!editingTitle) setDraftTitle(title);
  }, [title, editingTitle]);

  const startTitleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTitle(true);
  };
  const commitTitle = () => {
    const next = draftTitle.trim() || fallbackTitle;
    setEditingTitle(false);
    commit({ questionTitle: next });
  };
  const cancelTitle = () => {
    setEditingTitle(false);
    setDraftTitle(title);
  };

  // --- DraftJS editor state ---
  const initialEditorState = useMemo(() => {
    try {
      if (shape.draftRaw) {
        const raw = JSON.parse(shape.draftRaw);
        return EditorState.createWithContent(convertFromRaw(raw));
      }
    } catch {}
    return EditorState.createEmpty();
  }, []);

  const [editorState, setEditorState] =
    useState<EditorState>(initialEditorState);
  const [editingBody, setEditingBody] = useState(true);
  const [showToolbar, setShowToolbar] = useState(false);

  useEffect(() => {
    if (editingBody) return;
    try {
      if (shape.draftRaw) {
        const raw = JSON.parse(shape.draftRaw);
        setEditorState(EditorState.createWithContent(convertFromRaw(raw)));
      } else {
        setEditorState(EditorState.createEmpty());
      }
    } catch {
      // ignore bad JSON
    }
  }, [shape.draftRaw, editingBody]);

  useEffect(() => {
    if (!editingBody) return;
    const t = setTimeout(() => {
      const raw = convertToRaw(editorState.getCurrentContent());
      commit({ draftRaw: JSON.stringify(raw) });
    }, 500);
    return () => clearTimeout(t);
  }, [editorState, editingBody]);

  const startBodyEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBody(true);
  };
  const stopBodyEdit = () => setEditingBody(false);

  // Plain-text preview when not editing
  const previewText = useMemo(() => {
    const content = editorState.getCurrentContent();
    const text = content.hasText() ? content.getPlainText("\n") : "";
    return text.length ? text : "Write interview notes here…";
  }, [editorState]);

  console.log("valuePropData", valuePropData);

  return (
    <ShapeFrame
      {...props}
      resizable={true}
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      <div className="w-full h-full bg-white border-1 border-[#E9E6F0] rounded-xl shadow flex flex-col overflow-hidden px-8 py-6 gap-4">
        <h3 className="text-[11px] font-medium text-[#8B93A1]">Question</h3>
        {/* <h2 className="font-extrabold text-[14px] text-[#111827]">
          <span className="text-[#8B93A1] mr-1">1.</span>
          How much time does your team spend on project research?
        </h2> */}
        <h2
          className="font-extrabold text-[14px] text-[#111827]"
          onDoubleClick={startTitleEdit}
        >
          {/* <span className="text-[#8B93A1] mr-1">1.</span> */}
          {!editingTitle ? (
            <span>{title}</span>
          ) : (
            <input
              data-nodrag="true"
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitTitle}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitTitle();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelTitle();
                }
              }}
              className="w-[calc(100%-1.25rem)] bg-transparent outline-none border-b border-indigo-200"
              // ^ small underline to hint edit mode; tweak styles as you wish
            />
          )}
        </h2>
        {/* Body */}
        <div className="flex-1 overflow-auto">
          <h3 className="text-[11px] font-medium text-[#8B93A1]">Summary</h3>
          <div
            className="mt-5 rounded-[8px] "
            onMouseDown={(e) => e.stopPropagation()}
          >
            <RteEditor
              onBlur={() => setShowToolbar(false)}
              onFocus={() => setShowToolbar(true)}
              editorState={editorState}
              onEditorStateChange={setEditorState}
              toolbar={{
                options: ["inline", "list", "link", "history"],
                inline: {
                  options: ["bold", "italic", "underline", "strikethrough"],
                },
                list: { options: ["unordered", "ordered"] },
              }}
              toolbarHidden={!showToolbar}
              toolbarClassName="border-b px-2"
              editorClassName="px-2 py-2 min-h-[120px]"
              wrapperClassName=""
            />
          </div>
        </div>
      </div>
    </ShapeFrame>
  );
};
