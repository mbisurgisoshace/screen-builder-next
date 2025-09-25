"use client";
import dynamic from "next/dynamic";
import { ChevronDown, EllipsisIcon, MicIcon } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorState, convertFromRaw, convertToRaw } from "draft-js";

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

import {
  Select,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";
import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";
import { useQuestions } from "../../questions/QuestionsProvider";
import { CardFrame } from "../CardFrame";

type CustomerProps = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  onCommitStyle?: (id: string, patch: Partial<IShape>) => void;
};

// SSR-safe import (react-draft-wysiwyg touches window)
const RteEditor = dynamic(
  () => import("react-draft-wysiwyg").then((m) => m.Editor),
  { ssr: false }
);

export const BothCustomerEndUser: React.FC<CustomerProps> = (props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      const target = textareaRef.current;
      target.style.height = "auto";
      target.style.height = target.scrollHeight + "px";
    }
  }, [props.shape.cardTitle]);

  const questions = [
    {
      id: "gain_creators_question_1",
      card_type: "card",
      question:
        "On a scale of 1-10, 10 being highest, in your opinion what is the significance of this to the customer/user?",
      question_options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    },
  ];
  const { shape, onCommitStyle } = props;

  const tags: string[] = Array.isArray((shape as any).cardTags)
    ? ((shape as any).cardTags as string[])
    : [];

  const commit = (patch: Partial<IShape>) => {
    onCommitStyle?.(shape.id, patch);
  };

  function addTag(name: string) {
    if (!name) return;
    const next = Array.from(new Set([...(tags ?? []), name]));
    commit({ cardTags: next });
  }

  const fiQuestions = useMemo(
    () => questions.filter((q) => q.card_type === "card"),
    [questions]
  );

  const answeredCount = fiQuestions.reduce(
    (n, _q, i) => n + (tags[i] ? 1 : 0),
    0
  );

  const allAnswered =
    fiQuestions.length > 0 && answeredCount === fiQuestions.length;

  // Collapsed state: default closed only if already complete;
  // afterwards, user can toggle freely (no auto-collapse).
  // const [collapsed, setCollapsed] = useState<boolean>(allAnswered);
  const [collapsed, setCollapsed] = useState<boolean>(true);

  const userToggledRef = useRef(false);
  useEffect(() => {
    // If data loads after mount and user hasn't toggled yet,
    // sync the initial state once.
    if (!userToggledRef.current) setCollapsed(allAnswered);
  }, [allAnswered]);

  const questionsRef = useRef<HTMLDivElement | null>(null);

  function outerHeight(el: HTMLElement | null) {
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const cs = window.getComputedStyle(el);
    const mt = parseFloat(cs.marginTop || "0");
    const mb = parseFloat(cs.marginBottom || "0");
    return rect.height + mt + mb;
  }

  const MIN_HEIGHT = 75;

  function adjustHeight(delta: number) {
    // Only adjust if there is a visible change
    const current = shape.height ?? 200;
    const next = Math.max(MIN_HEIGHT, Math.round(current + delta));
    if (Math.abs(next - current) > 1) {
      commit({ height: next });
    }
  }

  function toggleCollapsed() {
    userToggledRef.current = true;
    // setCollapsed((c) => !c);
    if (!collapsed) {
      // Going to collapse: measure BEFORE hiding and shrink now
      const dh = -outerHeight(questionsRef.current);
      adjustHeight(dh);
      setCollapsed(true);
    } else {
      // Going to expand: first show, then measure and grow
      setCollapsed(false);
      // wait for layout to flush
      requestAnimationFrame(() => {
        const dh = outerHeight(questionsRef.current);
        adjustHeight(dh);
      });
    }
  }

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
  const [editingBody, setEditingBody] = useState(false);
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

  const handleCardClick = (e: React.MouseEvent) => {
    if (editingBody) {
      const target = e.target as HTMLElement;
      const isEditorClick =
        target.closest(".rdw-editor-wrapper") ||
        target.closest(".rdw-editor-toolbar") ||
        target.closest('button[class*="text-purple"]');

      if (!isEditorClick) {
        setEditingBody(false);
        setShowToolbar(false);
      }
    }
  };

  const editorText = editorState.getCurrentContent().getPlainText().trim();
  const hasContent =
    (shape.draftRaw && editorText.length > 0) ||
    (!shape.draftRaw && editorText.length > 0);
  const isEmpty = !hasContent && !editingBody;

  return (
    <div className="flex-1 overflow-auto">
      <div
        className="shadow-lg bg-[#FDE1B5]"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleCardClick}
      >
        <div className="p-6 pt-0">
          <div className="mb-4">
            <textarea
              ref={textareaRef}
              placeholder={"Type Both Customer & End-User here.."}
              className="w-full bg-transparent border-none outline-none font-manrope font-extrabold text-[24px] leading-[115%] tracking-[0%] text-[#111827] placeholder:text-[#858b9b] placeholder:font-extrabold placeholder:text-[24px] placeholder:leading-[115%] resize-none overflow-hidden"
              defaultValue={shape.cardTitle || ""}
              onBlur={(e) => {
                if (e.target.value !== shape.cardTitle) {
                  commit({ cardTitle: e.target.value });
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = target.scrollHeight + "px";
              }}
            />
          </div>
          {/* <div className="flex flex-row gap-2 p-2">
          <span>Significance Score:</span>
          {tags.map((t) => (
            <button
              key={t}
              title="Remove"
              data-nodrag="true"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                //removeTag(t);
              }}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200"
            >
              {t}
              <svg
                className="w-3 h-3 opacity-70"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  d="M6 6l8 8M14 6l-8 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ))}
        </div> */}

          <div className="mb-6">
            {isEmpty ? (
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setEditingBody(true);
                    setShowToolbar(true);
                  }}
                  className="text-black-600 underline hover:text-purple-800 text-sm font-medium transition-colors cursor-pointer"
                >
                  + add more details
                </button>
              </div>
            ) : (
              <RteEditor
                onBlur={() => {
                  setShowToolbar(false);
                  setEditingBody(false);
                  const contentState = editorState.getCurrentContent();
                  const hasText = contentState.hasText();
                  if (!hasText) {
                    setEditorState(EditorState.createEmpty());
                    commit({ draftRaw: undefined });
                  } else {
                    const raw = convertToRaw(contentState);
                    commit({ draftRaw: JSON.stringify(raw) });
                  }
                }}
                onFocus={() => {
                  setShowToolbar(true);
                  setEditingBody(true);
                }}
                editorState={editorState}
                onEditorStateChange={setEditorState}
                toolbar={{
                  options: ["inline", "list", "link"],
                  inline: {
                    options: ["bold", "italic", "underline", "strikethrough"],
                  },
                  list: { options: ["unordered", "ordered"] },
                }}
                //toolbarHidden={!showToolbar}
                toolbarClassName={`border-b px-2 text-[14px] pb-0 mb-0 ${
                  editingBody ? "bg-white" : "bg-transparent opacity-0"
                }`}
                editorClassName={`px-2 pt-0 pb-2 min-h-[120px] text-[14px] mt-0 font-manrope  font-medium text-[#2E3545] ${
                  editingBody ? "bg-[#FEEDD3] rounded" : "bg-transparent"
                }`}
                wrapperClassName="rdw-editor-wrapper"
                placeholder="Type your text here..."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
