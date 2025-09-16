"use client";
import dynamic from "next/dynamic";
import { ChevronDown, EllipsisIcon, MicIcon } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorState, convertFromRaw, convertToRaw } from "draft-js";

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";
import { useValueProp } from "@/app/(auth)/questions/_components/ValuePropProvider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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

  const formatValuePropStructure = () => {
    if (!valuePropData) return {};

    const options: any = {};

    valuePropData.forEach((item: any) => {
      if (options[item.subtype]) {
        options[item.subtype].push(item);
      } else {
        options[item.subtype] = [item];
      }
    });

    return options;
  };

  const formattedValuePropData = formatValuePropStructure();

  const userToggledRef = useRef(false);
  const questionsRef = useRef<HTMLDivElement | null>(null);

  const [collapsed, setCollapsed] = useState<boolean>(true);

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

  const getTitle = (subtype: string) => {
    switch (subtype) {
      case "solution_card":
        return "Solution";
      case "interview_card":
        return "Interview";
      case "assumption_card":
        return "Assumption";
      case "problem_statement_card":
        return "Problem Statement";
      case "jobs_to_be_done_card":
        return "Jobs To Be Done";
      case "pains_card":
        return "Pains";
      case "gains_card":
        return "Gains";
      case "products_services_card":
        return "Products & Services";
      case "pain_relievers_card":
        return "Pain Relievers";
      case "gain_creators_card":
        return "Gain Creators";
      case "summary_card":
        return "Summary";
      case "select_subtype":
        return "Select Card Type";
      default:
        return "Unknown";
    }
  };

  const updateCheckTags = (id: string, checked: boolean) => {
    let nextTags = shape.questionTags ? [...shape.questionTags] : [];
    if (checked) {
      if (!nextTags.includes(id)) {
        nextTags.push(id);
      }
    } else {
      nextTags = nextTags.filter((tag) => tag !== id);
    }
    commit({ questionTags: nextTags });
  };

  const firtQuestionsOrder = [
    {
      key: "jobs_to_be_done_card",
      label: "Jobs to be Done",
    },
    {
      key: "pains_card",
      label: "Pains",
    },
    {
      key: "gains_card",
      label: "Gains",
    },
  ];

  const secondQuestionsOrder = [
    {
      key: "products_services_card",
      label: "Products & Services",
    },
    {
      key: "pain_relievers_card",
      label: "Pain Relivers",
    },
    {
      key: "gain_creators_card",
      label: "Gain Creators",
    },
  ];

  return (
    <ShapeFrame
      {...props}
      resizable={true}
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      <div className="w-full h-full bg-white border-1 border-[#E9E6F0] rounded-xl shadow flex flex-col overflow-hidden px-8 py-6 gap-4">
        <h3 className="text-[11px] font-medium text-[#8B93A1]">Question</h3>
        {shape.questionTags && shape.questionTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {shape.questionTags.map((tag) => (
              <Badge key={tag} className="bg-indigo-100 text-indigo-800">
                {tag}
              </Badge>
            ))}
          </div>
        )}
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
            {/* <span className="ml-2 text-gray-400">
              ({answeredCount}/{fiQuestions.length})
            </span> */}
          </button>
        </div>

        {!collapsed && (
          <div
            ref={questionsRef}
            className="px-8 py-5 bg-[#F0EDF9] h-full flex flex-col gap-6 mt-3 rounded-md"
          >
            {firtQuestionsOrder.map(({ key, label }) => {
              const valueProp = formattedValuePropData[key];

              return (
                <div key={key}>
                  <h3 className="font-semibold mb-2">{getTitle(key)}</h3>
                  <div className="flex flex-col gap-2">
                    {valueProp.map((item: any) => {
                      if (!item.draftRaw) return null;
                      const raw = JSON.parse(item.draftRaw);
                      const editor = EditorState.createWithContent(
                        convertFromRaw(raw)
                      );
                      const text = editor.getCurrentContent().getPlainText();

                      return (
                        <div className="flex items-center gap-2" key={item.id}>
                          <Checkbox
                            key={item.id}
                            checked={shape.questionTags?.includes(
                              `${key}::${text}`
                            )}
                            className="bg-white"
                            onCheckedChange={(checked) => {
                              updateCheckTags(`${key}::${text}`, !!checked);
                            }}
                          />
                          <Label>{text}</Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="border border-dashed border-[black]" />

            {secondQuestionsOrder.map(({ key, label }) => {
              const valueProp = formattedValuePropData[key];

              return (
                <div key={key}>
                  <h3 className="font-semibold mb-2">{getTitle(key)}</h3>
                  <div className="flex flex-col gap-2">
                    {valueProp.map((item: any) => {
                      if (!item.draftRaw) return null;
                      const raw = JSON.parse(item.draftRaw);
                      const editor = EditorState.createWithContent(
                        convertFromRaw(raw)
                      );
                      const text = editor.getCurrentContent().getPlainText();

                      return (
                        <div className="flex items-center gap-2" key={item.id}>
                          <Checkbox
                            key={item.id}
                            checked={shape.questionTags?.includes(
                              `${key}::${text}`
                            )}
                            className="bg-white"
                            onCheckedChange={(checked) => {
                              updateCheckTags(`${key}::${text}`, !!checked);
                            }}
                          />
                          <Label>{text}</Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ShapeFrame>
  );
};
