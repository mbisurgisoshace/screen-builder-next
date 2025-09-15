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
import { Input } from "@/components/ui/input";
import { FloatingInput } from "@/components/ui/floating-input";
import { Label } from "@/components/ui/label";

type SummaryProps = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  onCommitStyle?: (id: string, patch: Partial<IShape>) => void;
};

// SSR-safe import (react-draft-wysiwyg touches window)
const RteEditor = dynamic(
  () => import("react-draft-wysiwyg").then((m) => m.Editor),
  { ssr: false }
);

export const Summary: React.FC<SummaryProps> = (props) => {
  const questions = [
    {
      id: "gain_creators_question_1",
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

  return (
    <div className="flex-1 overflow-auto">
      <div
        className="mt-1 rounded-[8px] "
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-6 p-2">
          <div className="flex flex-row items-center gap-1">
            <h3 className="text-3xl font-medium">Our</h3>
            <div className="relative">
              <Input
                value={shape.summary?.["our"]}
                onChange={(e) => {
                  commit({
                    summary: {
                      ...shape.summary,
                      ["our"]: e.target.value,
                    },
                  });
                }}
              />
              <Label className="absolute text-blue-600 -bottom-4">
                Products and Services
              </Label>
            </div>
          </div>
          <div className="flex flex-row items-center gap-1">
            <h3 className="text-3xl font-medium">help(s)</h3>
            <div className="relative">
              <Input
                value={shape.summary?.["help"]}
                onChange={(e) => {
                  commit({
                    summary: {
                      ...shape.summary,
                      ["help"]: e.target.value,
                    },
                  });
                }}
              />
              <Label className="absolute text-blue-600 -bottom-4">
                Customer Segment
              </Label>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-3xl font-medium">who want to </h3>
            <div className="relative">
              <Input
                value={shape.summary?.["who"]}
                onChange={(e) => {
                  commit({
                    summary: {
                      ...shape.summary,
                      ["who"]: e.target.value,
                    },
                  });
                }}
              />
              <Label className="absolute text-blue-600 -bottom-4">
                Jobs to be Done
              </Label>
            </div>
          </div>
          <div className="flex flex-row items-center gap-1">
            <h3 className="text-3xl font-medium">by</h3>
            <div className="relative">
              <Input
                value={shape.summary?.["verb_pain"]}
                onChange={(e) => {
                  commit({
                    summary: {
                      ...shape.summary,
                      ["verb_pain"]: e.target.value,
                    },
                  });
                }}
              />
              <Label className="absolute text-blue-600 -bottom-4">Verb</Label>
            </div>
            <div className="relative">
              <Input
                value={shape.summary?.["pain"]}
                onChange={(e) => {
                  commit({
                    summary: {
                      ...shape.summary,
                      ["pain"]: e.target.value,
                    },
                  });
                }}
              />
              <Label className="absolute text-blue-600 -bottom-4">
                Customer Pain
              </Label>
            </div>
          </div>
          <div className="flex flex-row items-center gap-1">
            <h3 className="text-3xl font-medium">and</h3>
            <div className="relative">
              <Input
                value={shape.summary?.["verb_gain"]}
                onChange={(e) => {
                  commit({
                    summary: {
                      ...shape.summary,
                      ["verb_gain"]: e.target.value,
                    },
                  });
                }}
              />
              <Label className="absolute text-blue-600 -bottom-4">Verb</Label>
            </div>
            <div className="relative">
              <Input
                value={shape.summary?.["gain"]}
                onChange={(e) => {
                  commit({
                    summary: {
                      ...shape.summary,
                      ["gain"]: e.target.value,
                    },
                  });
                }}
              />
              <Label className="absolute text-blue-600 -bottom-4">
                Customer Gain
              </Label>
            </div>
          </div>
          <div className="flex flex-row items-center gap-1">
            <h3 className="text-3xl font-medium">(unlike</h3>
            <div className="relative w-full">
              <Input
                value={shape.summary?.["unlike"]}
                onChange={(e) => {
                  commit({
                    summary: {
                      ...shape.summary,
                      ["unlike"]: e.target.value,
                    },
                  });
                }}
              />
              <Label className="absolute text-blue-600 -bottom-4">
                Competing Value Proposition
              </Label>
            </div>
            <h3 className="text-3xl font-medium">)</h3>
          </div>
        </div>
      </div>
    </div>
  );
};
