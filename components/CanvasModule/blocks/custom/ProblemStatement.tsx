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

type ProblemStatementProps = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  onCommitStyle?: (id: string, patch: Partial<IShape>) => void;
};

export const ProblemStatement: React.FC<ProblemStatementProps> = (props) => {
  const { questions } = useQuestions();
  const { shape, onCommitStyle } = props;

  const tags: string[] = Array.isArray((shape as any).featureIdeaTags)
    ? ((shape as any).featureIdeaTags as string[])
    : [];

  const commit = (patch: Partial<IShape>) => onCommitStyle?.(shape.id, patch);

  function addTag(name: string) {
    if (!name) return;
    const next = Array.from(new Set([...(tags ?? []), name]));
    commit({ featureIdeaTags: next });
  }

  const fiQuestions = useMemo(
    () => questions.filter((q) => q.card_type === "feature_idea"),
    [questions]
  );

  // Count “answered” by checking each question index has a non-empty tag
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

  const MIN_HEIGHT = 160;

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

  //const body = ;

  return (
    <div>
      <div className="px-8 py-5">
        <h2 className="font-extrabold text-[16px] text-[#111827]">
          How much time does your team spend on project research?
        </h2>

        <div className="flex flex-row gap-2 mt-3">
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
        </div>
      </div>

      <div className="px-8 flex items-center justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapsed();
          }}
          data-nodrag="true"
          className="inline-flex items-center gap-2 text-[12px] text-gray-700 bg-white border rounded-md px-2 py-1 hover:bg-gray-50"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              collapsed ? "-rotate-90" : "rotate-0"
            }`}
          />
          {collapsed ? "Show questions" : "Hide questions"}
          <span className="ml-2 text-gray-400">
            ({answeredCount}/{fiQuestions.length})
          </span>
        </button>
      </div>

      {/* Questions (collapsible) */}
      {!collapsed && (
        <div
          ref={questionsRef}
          className="px-8 py-5 bg-[#F0EDF9] h-full flex flex-col gap-6 mt-3 rounded-md"
        >
          {fiQuestions.map((q, idx) => (
            <div className="flex flex-col gap-3" key={q.id}>
              <h3 className="font-bold text-[14px] text-[#111827]">
                {q.question}
              </h3>

              <div
                data-nodrag="true"
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full"
              >
                <Select value={tags[idx] ?? ""} onValueChange={addTag}>
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
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // return (
  //   <CardFrame {...props} header={<span>Problem Statement</span>} body={body} />
  // );
};
