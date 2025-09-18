"use client";
import dynamic from "next/dynamic";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
  UserIcon,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorState, convertFromRaw, convertToRaw } from "draft-js";

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";
import { CardFrame } from "../CardFrame";

type FeatureIdeaProps = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  onCommitInterview?: (id: string, patch: Partial<IShape>) => void;
};

// SSR-safe import (react-draft-wysiwyg touches window)
const RteEditor = dynamic(
  () => import("react-draft-wysiwyg").then((m) => m.Editor),
  { ssr: false }
);

export const FeatureIdea: React.FC<FeatureIdeaProps> = (props) => {
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

  // --- DraftJS editor state ---
  const initialFeatureIdeaEditorState = useMemo(() => {
    try {
      if (shape.featureIdeaDraftRaw) {
        const raw = JSON.parse(shape.featureIdeaDraftRaw);
        return EditorState.createWithContent(convertFromRaw(raw));
      }
    } catch {}
    return EditorState.createEmpty();
  }, []);

  const [editorState, setEditorState] =
    useState<EditorState>(initialEditorState);
  const [editingBody, setEditingBody] = useState(true);

  const [featureIdeaEditorState, setFeatureIdeaEditorState] =
    useState<EditorState>(initialFeatureIdeaEditorState);

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
    try {
      if (shape.featureIdeaDraftRaw) {
        const raw = JSON.parse(shape.featureIdeaDraftRaw);
        setFeatureIdeaEditorState(
          EditorState.createWithContent(convertFromRaw(raw))
        );
      } else {
        setFeatureIdeaEditorState(EditorState.createEmpty());
      }
    } catch {}
  }, [shape.featureIdeaDraftRaw]);

  useEffect(() => {
    if (!editingBody) return;
    const t = setTimeout(() => {
      const raw = convertToRaw(editorState.getCurrentContent());
      const featureIdeaRaw = convertToRaw(
        featureIdeaEditorState.getCurrentContent()
      );
      commit({
        draftRaw: JSON.stringify(raw),
        featureIdeaDraftRaw: JSON.stringify(featureIdeaRaw),
      });
    }, 500);
    return () => clearTimeout(t);
  }, [editorState, featureIdeaEditorState, editingBody]);

  const [showToolbarFeature, setShowToolbarFeature] = useState(false);
  const [showToolbarWhyFeature, setShowToolbarWhyFeature] = useState(false);

  return (
    <CardFrame
      {...props}
      useAttachments={true}
      header="Feature Idea"
      body={
        <div className="h-full flex flex-row rounded-xl  bg-white">
          <div className="w-full h-full flex flex-col overflow-hidden px-8 py-6 gap-4 border-r ">
            <h3 className="text-[14px] font-bold text-black">Feature Idea</h3>
            {/* Body */}
            <div className="flex-1 overflow-auto">
              <div
                className="rounded-[8px] "
                onMouseDown={(e) => e.stopPropagation()}
              >
                <RteEditor
                  onBlur={() => setShowToolbarFeature(false)}
                  onFocus={() => setShowToolbarFeature(true)}
                  editorState={editorState}
                  onEditorStateChange={setEditorState}
                  toolbar={{
                    options: ["inline", "list", "link", "history"],
                    inline: {
                      options: ["bold", "italic", "underline", "strikethrough"],
                    },
                    list: { options: ["unordered", "ordered"] },
                  }}
                  toolbarHidden={!showToolbarFeature}
                  toolbarClassName={`border-b px-2 text-[14px] ${editingBody ? 'bg-white' : 'bg-transparent'}`}
                  editorClassName={`px-2 py-2 min-h-[120px] text-[14px] ${editingBody ? "bg-white rounded" : "bg-transparent"
                    } placeholder:text-gray-500 `}
                  wrapperClassName=""
                  placeholder="Write here..."
                />
              </div>
            </div>
          </div>
          <div className="w-full h-full flex flex-col overflow-hidden px-8 py-6 gap-4">
            <h3 className="text-[14px] font-bold text-black">
              Why we need this feature
            </h3>
            {/* Body */}
            <div className="flex-1 overflow-auto">
              <div
                className="rounded-[8px] "
                onMouseDown={(e) => e.stopPropagation()}
              >
                <RteEditor
                  onBlur={() => setShowToolbarWhyFeature(false)}
                  onFocus={() => setShowToolbarWhyFeature(true)}
                  editorState={featureIdeaEditorState}
                  onEditorStateChange={setFeatureIdeaEditorState}
                  toolbar={{
                    options: ["inline", "list", "link", "history"],
                    inline: {
                      options: ["bold", "italic", "underline", "strikethrough"],
                    },
                    list: { options: ["unordered", "ordered"] },
                  }}
                  toolbarHidden={!showToolbarWhyFeature}
                  toolbarClassName={`border-b px-2 text-[14px] ${editingBody ? 'bg-white' : 'bg-transparent'}`}
                  editorClassName={`px-2 py-2 min-h-[120px] text-[14px] ${editingBody ? "bg-white rounded" : "bg-transparent"
                    } placeholder:text-gray-500 `}
                  wrapperClassName=""
                  placeholder="Write here..."
                />
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
};
