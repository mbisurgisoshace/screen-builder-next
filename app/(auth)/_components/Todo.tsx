"use client";

import { CheckIcon } from "lucide-react";
import { updateTodo } from "@/services/todos";

import { Task } from "../page";

interface TodoProps {
  todos: Task[];
  title: string;
}

export default function Todo({ title, todos }: TodoProps) {
  const markAsComplete = async (id: string, complete: boolean) => {
    await updateTodo(id, { completed: complete });
  };

  return (
    <div className="border-2 bg-white border-white rounded-[12px] w-[350px] min-w-[350px] overflow-hidden">
      <div className="px-[22px] py-[15px] bg-gradient-to-r from-[#6376F120] to-[#6376F100] ">
        <h3 className="text-[14px] font-semibold text-[#111827]">
          {isNaN(Number(title)) ? title : `Day ${title}`}
        </h3>
      </div>
      <div className="px-[22px] py-[15px] flex flex-col gap-4">
        {todos.map((todo) => (
          <div key={todo.task}>
            <h5 className="text-[11px] text-[#111827] font-medium opacity-50 mb-3">
              {todo.task}
            </h5>
            <ul className="flex gap-1 flex-col">
              {todo.todos.map((todo) => (
                <li
                  key={todo.text}
                  className={`text-[#B5BCCB] border-[0.5px] rounded-[8px] px-[9px] py-[13px] flex flex-row gap-3.5 items-center ${
                    todo.completed ? "bg-[#E4E5ED66]" : ""
                  }`}
                >
                  <div
                    className={`size-4 rounded-full text-[#B5BCCC] border flex items-center justify-center ${
                      todo.completed
                        ? "bg-[#42BC5C] border-[#42BC5C]"
                        : "border"
                    }`}
                    onClick={() => {
                      markAsComplete(todo.id, !todo.completed);
                    }}
                  >
                    {todo.completed && (
                      <CheckIcon className="size-2 text-white " />
                    )}
                  </div>
                  <span
                    className={`text-[14px] font-medium text-[#888B93] ${
                      todo.completed ? "line-through" : ""
                    }`}
                  >
                    {todo.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
