import { Task } from "@/lib/generated/prisma";
import { CheckIcon } from "lucide-react";

interface TextTodoProps {
  todo: Task;
  isCompleted: boolean;
  markAsComplete: (id: number, complete: boolean) => Promise<void>;
}

export default function TextTodo({
  todo,
  isCompleted,
  markAsComplete,
}: TextTodoProps) {
  return (
    <li
      key={todo.id}
      className={`text-[#B5BCCB] border-[0.5px] border-[#B5BCCC] rounded-[8px] px-[12px] py-[12px] flex flex-col gap-2 ${
        isCompleted ? "bg-[#E4E5ED66]" : ""
      }`}
    >
      <div className="flex flex-row gap-3.5 items-center">
        <div
          className={`size-4 min-w-4 rounded-full text-[#B5BCCC] border border-[#B5BCCC] flex items-center justify-center ${
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
      <div className="flex flex-col gap-5 pl-[30px]">
        <h3
          className={`text-[14px] font-medium text-[#2E3545] break-words overflow-wrap-anywhere ${
            isCompleted ? "line-through" : ""
          }`}
          dangerouslySetInnerHTML={{ __html: todo.task_description || "" }}
        />
      </div>
    </li>
  );
}
