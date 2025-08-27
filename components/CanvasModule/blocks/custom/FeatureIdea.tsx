"use client";
import dynamic from "next/dynamic";
import { EllipsisIcon, MicIcon } from "lucide-react";
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

type FeatureIdeaProps = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  onCommitStyle?: (id: string, patch: Partial<IShape>) => void;
};

export const FeatureIdea: React.FC<FeatureIdeaProps> = (props) => {
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

  const body = (
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
      <div className="px-8 py-5 bg-[#F0EDF9] h-full flex flex-col gap-6">
        {questions
          .filter((q) => q.card_type === "feature_idea")
          .map((q, idx) => (
            <div className="flex flex-col gap-3" key={q.id}>
              <h3 className="font-bold text-[14px] text-[#111827]">
                {q.question}
              </h3>

              <Select onValueChange={addTag} value={tags[idx]}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {q.question_options.map((option) => (
                    <SelectItem value={option} key={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <CardFrame {...props} header={<span>Problem Statement</span>} body={body} />
  );
};
