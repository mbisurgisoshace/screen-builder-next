import { CheckIcon } from "lucide-react";
import { Task, Todo } from "../page";
import Image from "next/image";

interface ImageTodoProps {
  todo: Todo;
  markAsComplete: (id: string, complete: boolean) => Promise<void>;
}

export default function ImageTodo({ todo, markAsComplete }: ImageTodoProps) {
  return (
    <li
      key={todo.id}
      className={`text-[#B5BCCB] border-[0.5px] rounded-[8px] px-[24px] py-[13px] flex flex-col gap-3.5 ${
        todo.completed ? "bg-[#E4E5ED66]" : ""
      }`}
    >
      <div className="flex flex-row gap-3.5 items-center">
        <div
          className={`size-4 rounded-full text-[#B5BCCC] border flex items-center justify-center ${
            todo.completed ? "bg-[#42BC5C] border-[#42BC5C]" : "border"
          }`}
          onClick={() => {
            markAsComplete(todo.id, !todo.completed);
          }}
        >
          {todo.completed && <CheckIcon className="size-2 text-white " />}
        </div>
        <span
          className={`text-[16px] font-extrabold text-[#111827] ${
            todo.completed ? "line-through" : ""
          }`}
        >
          {todo.text}
        </span>
      </div>
      <div className="flex flex-col gap-5 pl-[30px]">
        <h3
          className={`text-[14px] font-medium text-[#2E3545] ${
            todo.completed ? "line-through" : ""
          }`}
        >
          {todo.description}
        </h3>
        <img
          src={todo.url!}
          alt={todo.description || ""}
          className="w-full bg-cover rounded-[10px]"
        />
      </div>
    </li>
  );
}
