"use client";
import dynamic from "next/dynamic";
import { Slider } from "@/components/ui/slider";
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

type JobsToBeDoneProps = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  onCommitStyle?: (id: string, patch: Partial<IShape>) => void;
};

// SSR-safe import (react-draft-wysiwyg touches window)
const RteEditor = dynamic(
  () => import("react-draft-wysiwyg").then((m) => m.Editor),
  { ssr: false }
);

export const JobsToBeDone: React.FC<JobsToBeDoneProps> = (props) => {
  const questions = [
    {
      id: "jobs_to_be_done_question_1",
      card_type: "card",
      question:
        "On a scale of 1-10, 10 being highest, what is the significance of this to the customer/user?",
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
    const next = [name];
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
  const [collapsed, setCollapsed] = useState<boolean>(allAnswered);

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

  const [currentValue, setCurrentValue] = useState<number>(0);

  const hasContent =
    shape.cardTitle ||
    (shape.draftRaw && editorState.getCurrentContent().hasText());
  const isEmpty = !hasContent && !editingBody;

  return (
    <div className="flex-1 overflow-auto">
      <div
        className="shadow-lg bg-[#FDE1B5]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-6 pt-0">
          <div className="mb-4">
            <input
              type="text"
              placeholder={"Type your title here.."}
              className="w-full bg-transparent border-none outline-none font-manrope font-extrabold text-[24px] leading-[115%] tracking-[0%] text-[#111827] placeholder:text-[#858b9b] placeholder:font-extrabold placeholder:text-[24px] placeholder:leading-[115%]"
              defaultValue={shape.cardTitle || ""}
              onBlur={(e) => {
                if (e.target.value !== shape.cardTitle) {
                  commit({ cardTitle: e.target.value });
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>

          <div className="mb-6">
            {isEmpty ? (
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setEditingBody(true);
                    setShowToolbar(true);
                  }}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors cursor-pointer"
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
                  }
                }}
                onFocus={() => {
                  setShowToolbar(true);
                  setEditingBody(true);
                }}
                editorState={editorState}
                onEditorStateChange={setEditorState}
                toolbar={{
                  options: ["inline", "list", "link", "history"],
                  inline: {
                    options: ["bold", "italic", "underline", "strikethrough"],
                  },
                  list: { options: ["unordered", "ordered"] },
                }}
                //toolbarHidden={!showToolbar}
                toolbarClassName={`border-b px-2 text-[14px] pb-0 mb-0 ${
                  editingBody ? "bg-white" : "bg-transparent"
                }`}
                editorClassName={`px-2 pt-0 pb-2 min-h-[120px] text-[14px] mt-0 font-manrope  font-medium text-[#2E3545] ${
                  editingBody ? "bg-[#FEEDD3] rounded" : "bg-[#FEEDD3]"
                }`}
                wrapperClassName="rdw-editor-wrapper"
                placeholder="Type your text here..."
              />
            )}
          </div>
          <div className="pt-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapsed();
              }}
              data-nodrag="true"
              className="w-full flex items-center justify-between text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span className="flex items-center gap-2 font-manrope font-bold text-[#111827] text-[14px]">
                {collapsed
                  ? `Subquestions (${fiQuestions.length})`
                  : `Subquestions (${fiQuestions.length})`}
                <ChevronDown
                  className={`w-4 h-4 transition-transform text-[#80889D] ${
                    collapsed ? "-rotate-90" : "rotate-0"
                  }`}
                />
              </span>
              {/* <span className="text-gray-400">
                ({answeredCount}/{fiQuestions.length})
              </span> */}
            </button>

            {!collapsed && (
              <div
                ref={questionsRef}
                className="mt-4 p-4 rounded-lg  bg-[#FEEDD3]"
              >
                {fiQuestions.map((q, idx) => (
                  <div className="flex flex-col gap-3" key={q.id}>
                    <h3 className="font-semibold text-sm text-gray-800">
                      {q.question}
                    </h3>

                    <div
                      data-nodrag="true"
                      onMouseDown={(e) => e.stopPropagation()}
                      className="w-full"
                    >
                      {/* <Select value={tags[idx] ?? ""} onValueChange={addTag}>
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent onMouseDown={(e) => e.stopPropagation()}>
                      {q.question_options.map((option) => (
                        <SelectItem value={option} key={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select> */}
                      <div className="flex flex-col gap-2 items-center">
                        <Slider
                          min={0}
                          max={10}
                          step={1}
                          defaultValue={[parseInt(tags[idx]) || 0]}
                          value={currentValue ? [currentValue] : undefined}
                          onValueCommit={(value) => addTag(value[0].toString())}
                          onValueChange={(value) => setCurrentValue(value[0])}
                          className="w-full"
                        />
                        <span className="text-xs font-medium text-gray-700">
                          {currentValue || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {tags.length > 0 && (
            <div className="mt-4 flex flex-row gap-2 items-center">
              <span className="text-sm text-gray-600">Significance Score:</span>
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
