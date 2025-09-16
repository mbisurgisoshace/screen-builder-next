import {
  CheckIcon,
  Clock3Icon,
  CopyIcon,
  ExternalLinkIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Task } from "@/lib/generated/prisma";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

interface ScheduleTodoProps {
  todo: Task;
  isCompleted: boolean;
  data: Record<string, any>;
  markAsComplete: (id: number, complete: boolean) => Promise<void>;
}

export default function ScheduleTodo({
  todo,
  data,
  isCompleted,
  markAsComplete,
}: ScheduleTodoProps) {
  const [scheduleData, setScheduleData] = useState(
    data
      ? data
      : {
          mentor: "",
          date: "",
          time: "",
        }
  );

  return (
    <li
      key={todo.id}
      className={`text-[#B5BCCB] border-[0.5px] border-[#B5BCCC] rounded-[8px] px-[12px] py-[12px] flex flex-col gap-3.5 ${
        isCompleted ? "bg-[#E4E5ED66]" : ""
      }`}
    >
      <div className="flex  gap-3.5 items-center">
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
          className={`text-[16px] font-bold text-[#111827] ${
            isCompleted ? "line-through" : ""
          }`}
        >
          {todo.title}
        </span>
      </div>
      <div className="flex flex-col">
        <Calendar mode="single" className="w-full" />
        <div className="border border-[#E4E5ED] rounded-md">
          <div className="flex flex-row gap-2 items-center bg-[#EEF0FA] py-4 px-6">
            <Clock3Icon size={14} />
            <span className="text-[14px] font-extrabold text-[#111827]">
              Select time
            </span>
          </div>
          <div className="py-4 px-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 justify-items-center">
              <span className="border-[1.5px] border-[#E4E5ED] w-[67px] h-[30px] flex items-center justify-center text-xs font-semibold rounded-md">
                9:30 PM
              </span>
              <span className="border-[1.5px] border-[#E4E5ED] w-[67px] h-[30px] flex items-center justify-center text-xs font-semibold rounded-md">
                11:45 PM
              </span>
              <span className="border-[1.5px] border-[#E4E5ED] w-[67px] h-[30px] flex items-center justify-center text-xs font-semibold rounded-md">
                2:30 AM
              </span>
              <span className="border-[1.5px] border-[#E4E5ED] w-[67px] h-[30px] flex items-center justify-center text-xs font-semibold rounded-md">
                4:30 PM
              </span>
              <span className="border-[1.5px] border-[#E4E5ED] w-[67px] h-[30px] flex items-center justify-center text-xs font-semibold rounded-md">
                7:30 PM
              </span>
            </div>
            <Button>Save</Button>
          </div>
        </div>
      </div>
    </li>
  );
}
