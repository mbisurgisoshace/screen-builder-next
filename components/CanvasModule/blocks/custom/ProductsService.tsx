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

type ProductsServiceProps = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  onCommitStyle?: (id: string, patch: Partial<IShape>) => void;
};

// SSR-safe import (react-draft-wysiwyg touches window)
const RteEditor = dynamic(
  () => import("react-draft-wysiwyg").then((m) => m.Editor),
  { ssr: false }
);

export const ProductsService: React.FC<ProductsServiceProps> = (props) => {
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
      id: "products_service_question_1",
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
        className="shadow-lg bg-[#DDF5B5]"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleCardClick}
      >
        <div className="p-6 pt-0">
          <div className="mb-4">
            <textarea
              ref={textareaRef}
              placeholder={"Type Products/Services here.."}
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
              toolbarClassName={`border-b px-2 text-[14px]  ${
                editingBody ? "bg-white" : "bg-transparent opacity-0"
              }`}
              editorClassName={`px-2 py-2 min-h-[120px]  text-[14px]  ${
                editingBody ? "bg-[#EBF9D3] rounded" : "bg-[#EBF9D3]"
              }`}
              wrapperClassName=""
              placeholder="Type your text here..."
            />
          )}
        </div>

        {/* <div className="px-8 flex items-center justify-center">
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
      )} */}
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
  );
};
