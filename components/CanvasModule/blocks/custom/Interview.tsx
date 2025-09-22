"use client";
import dynamic from "next/dynamic";
import { EllipsisIcon, MicIcon } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorState, convertFromRaw, convertToRaw } from "draft-js";

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";

type InterviewProps = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  onCommitInterview?: (id: string, patch: Partial<IShape>) => void;
};

// SSR-safe import (react-draft-wysiwyg touches window)
const RteEditor = dynamic(
  () => import("react-draft-wysiwyg").then((m) => m.Editor),
  { ssr: false }
);

export const Interview: React.FC<InterviewProps> = (props) => {
  const { shape, onCommitInterview } = props;

  const commit = (patch: Partial<IShape>) => {
    onCommitInterview?.(shape.id, patch);
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

  return (
    <ShapeFrame
      {...props}
      resizable={true}
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      <div className="w-full h-full bg-white border-2 border-white rounded-xl shadow flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2 bg-gradient-to-r from-indigo-200 to-indigo-100 text-[#6376F2] font-semibold flex items-start justify-between break-words whitespace-normal">
          <span>Interview</span>
          <span className="text-[#111827] text-[11px] font-medium opacity-50">
            Jul 18, 2025
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 p-3 overflow-auto">
          <div className="flex items-center">
            <div className="h-[50px] w-[50px] bg-[#F4F0FF] rounded-full flex items-center justify-center">
              <MicIcon className="h-[26px] w-[26px] text-[#6376F2]" />
            </div>

            {/* Interviewer */}
            <div className="flex flex-col ml-5">
              <span className="text-[#111827] opacity-50 text-[11px] font-medium">
                Interviewed person
              </span>
              <span className="text-[#111827] text-[14px] font-medium">
                Anastasia Wellington
              </span>
            </div>

            {/* Interviewee */}
            <div className="flex flex-col ml-20">
              <span className="text-[#111827] opacity-50 text-[11px] font-medium">
                Persona (Role)
              </span>
              <span className="text-[#111827] text-[14px] font-medium">
                Project manager
              </span>
            </div>

            <div className="h-[30px] w-[30px] border-1 border-[#E9E6F0] rounded-full flex items-center justify-center ml-auto">
              <EllipsisIcon className="text-[#8B93A1]" />
            </div>
          </div>

          <div
            className="mt-5 rounded-[8px] bg-[#E4E5ED]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <RteEditor
              onBlur={() => {
                setShowToolbar(false);
                const raw = convertToRaw(editorState.getCurrentContent());
                commit({ draftRaw: JSON.stringify(raw) });
              }}
              onFocus={() => setShowToolbar(true)}
              editorState={editorState}
              onEditorStateChange={setEditorState}
              toolbar={{
                options: ["inline", "list", "link"],
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
