"use client";

import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Task } from "@/lib/generated/prisma";
import { useState } from "react";
import Mentors from "./Mentors";
import AboutProgram from "./AboutProgram";

interface ModalTodoProps {
  todo: Task;
  isCompleted: boolean;
  markAsComplete: (id: number, complete: boolean) => Promise<void>;
}

export default function ModalTodo({
  todo,
  isCompleted,
  markAsComplete,
}: ModalTodoProps) {
  const [isMentorsOpen, setIsMentorsOpen] = useState(false);
  const [isAboutProgramOpen, setIsAboutProgramOpen] = useState(false);

  const handleClick = () => {
    if (todo.task_url === "mentors") {
      setIsMentorsOpen(true);
    } else if (todo.task_url === "about_program") {
      setIsAboutProgramOpen(true);
    }
  };

  const getDisplayText = () => {
    if (todo.task_url === "mentors") {
      return "View Mentors";
    } else if (todo.task_url === "about_program") {
      return "View About Program";
    }
    return todo.task_url || "Open Modal";
  };

  return (
    <>
      <li
        key={todo.id}
        className={`text-[#B5BCCB] border-[0.5px] border-[#B5BCCC] rounded-[8px] px-[12px] py-[12px] flex flex-col gap-3.5 ${
          isCompleted ? "bg-[#E4E5ED66]" : ""
        }`}
      >
        <div className="flex gap-3.5 items-center">
          <div
            className={`size-4 min-w-[16px] rounded-full text-[#B5BCCC] border border-[#B5BCCC] flex items-center justify-center ${
              isCompleted ? "bg-[#42BC5C] border-[#42BC5C]" : "border"
            }`}
            onClick={() => {
              markAsComplete(todo.id, !isCompleted);
            }}
          >
            {isCompleted && <CheckIcon className="size-2 text-white " />}
          </div>

          <span
            className={`w-full rounded-lg border-[1.5px] px-[12px] py-[12px] border-[#E4E5ED] text-[14px] font-medium text-[#6A35FF] cursor-pointer ${
              isCompleted ? "line-through" : ""
            }`}
            onClick={handleClick}
          >
            {getDisplayText()}
          </span>
        </div>
        <div className="flex ml-7">
          <span 
            className="rounded-lg border-[1.5px] h-[44px] w-[44px] mr-2 cursor-pointer"
            onClick={handleClick}
          >
            <Button variant={"link"} className="w-full h-full">
              <ExternalLinkIcon className="text-[#8B93A1]" />
            </Button>
          </span>
          <span className="rounded-lg border-[1.5px] h-[44px] w-[44px]">
            <Button
              variant={"link"}
              className="w-full h-full"
              onClick={() => {
                navigator.clipboard.writeText(todo.task_url!);
              }}
            >
              <CopyIcon className="text-[#8B93A1]" />
            </Button>
          </span>
        </div>
      </li>

      <Mentors isOpen={isMentorsOpen} onClose={() => setIsMentorsOpen(false)} />
      <AboutProgram isOpen={isAboutProgramOpen} onClose={() => setIsAboutProgramOpen(false)} />
    </>
  );
}
