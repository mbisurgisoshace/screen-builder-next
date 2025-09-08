"use client";

import { ChevronDown, EllipsisIcon, MicIcon, MoreVertical } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { ProblemStatement } from "./ProblemStatement";
import { Interview } from "./InterviewCard";

type CardProps = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  onCommitStyle?: (id: string, patch: Partial<IShape>) => void;
};

export const Card: React.FC<CardProps> = (props) => {
  const { shape, onCommitStyle } = props;
  const { subtype } = shape;

  const body = <div>{`Card Subtype: ${subtype}`}</div>;

  const getTitle = () => {
    switch (subtype) {
      case "solution_card":
        return "Solution";
      case "interview_card":
        return "Interview";
      case "assumption_card":
        return "Assumption";
      case "problem_statement_card":
        return "Problem Statement";
      default:
        return "Unknown";
    }
  };

  const getBody = () => {
    switch (subtype) {
      case "solution_card":
        return <span>Solution Card</span>;
      case "interview_card":
        return <Interview {...props} />;
      case "assumption_card":
        return <span>Assumption Card</span>;
      case "problem_statement_card":
        return <ProblemStatement {...props} />;
    }
  };

  const useAttachments = () => {
    switch (subtype) {
      case "solution_card":
        return false;
      case "interview_card":
        return false;
      case "assumption_card":
        return false;
      case "problem_statement_card":
        return false;
      default:
        return true;
    }
  };

  return (
    <CardFrame
      {...props}
      useAttachments={useAttachments()}
      header={
        <div className="w-full flex flex-row items-center justify-between">
          <span>{getTitle()}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open</span>
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="absolute -top-11 left-5 p-1.5 w-[216px]"
            >
              <DropdownMenuItem
                onClick={() => {
                  onCommitStyle?.(shape.id, { subtype: "assumption_card" });
                }}
                className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
                  subtype === "assumption_card" ? "bg-[#D5F9D7]" : ""
                }`}
              >
                Assumption card
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onCommitStyle?.(shape.id, {
                    subtype: "problem_statement_card",
                  });
                }}
                className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
                  subtype === "problem_statement_card" ? "bg-[#D5F9D7]" : ""
                }`}
              >
                Problem Statement card
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onCommitStyle?.(shape.id, { subtype: "interview_card" });
                }}
                className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
                  subtype === "interview_card" ? "bg-[#D5F9D7]" : ""
                }`}
              >
                Interview card
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onCommitStyle?.(shape.id, { subtype: "solution_card" });
                }}
                className={`rounded-sm text-xs font-semibold text-[#111827] px-4 py-2 ${
                  subtype === "solution_card" ? "bg-[#D5F9D7]" : ""
                }`}
              >
                Solution card
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
      body={getBody()}
    />
  );
};
