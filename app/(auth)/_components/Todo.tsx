"use client";

import { CheckIcon } from "lucide-react";
import { updateTodo } from "@/services/todos";

import { Task, Todo as ITodo } from "../page";
import ImageTodo from "./ImageTodo";
import VideoTodo from "./VideoTodo";
import LinkTodo from "./LinkTodo";

interface TodoProps {
  todos: Task[];
  title: string;
}

export default function Todo({ title, todos }: TodoProps) {
  const markAsComplete = async (id: string, complete: boolean) => {
    await updateTodo(id, { completed: complete });
  };

  const renderTodo = (todo: ITodo) => {
    if (todo.type === "text") {
      //return <span key={todo.id}>Text</span>;
      return null;
    }

    if (todo.type === "link") {
      return (
        <LinkTodo key={todo.id} todo={todo} markAsComplete={markAsComplete} />
      );
    }

    if (todo.type === "image") {
      return (
        <ImageTodo key={todo.id} todo={todo} markAsComplete={markAsComplete} />
      );
    }

    if (todo.type === "video") {
      return (
        <VideoTodo key={todo.id} todo={todo} markAsComplete={markAsComplete} />
      );
    }
  };

  return (
    <div className="border-2 bg-white border-white rounded-[12px] w-[300px] min-w-[300px] overflow-y-auto h-full max-h-600">
      <div className="px-[22px] py-[15px] bg-[#7559C3]">
        <h3 className="text-[14px] font-semibold text-white">
          {isNaN(Number(title)) ? title : `Session ${title}`}
        </h3>
      </div>
      <div className="px-[12px] py-[12px] flex flex-col gap-4">
        {todos.map((todo) => (
          <div key={todo.task}>
            <h5 className="text-[14px] text-[#111827] font-medium opacity-70 mb-3">
              {todo.task}
            </h5>
            <ul className="flex gap-1 flex-col">
              {todo.todos.map((todo) => {
                return renderTodo(todo);
                //   return (
                //   <li
                //     key={todo.text}
                //     className={`text-[#B5BCCB] border-[0.5px] rounded-[8px] px-[9px] py-[13px] flex flex-row gap-3.5 items-center ${
                //       todo.completed ? "bg-[#E4E5ED66]" : ""
                //     }`}
                //   >
                //     <div
                //       className={`size-4 rounded-full text-[#B5BCCC] border flex items-center justify-center ${
                //         todo.completed
                //           ? "bg-[#42BC5C] border-[#42BC5C]"
                //           : "border"
                //       }`}
                //       onClick={() => {
                //         markAsComplete(todo.id, !todo.completed);
                //       }}
                //     >
                //       {todo.completed && (
                //         <CheckIcon className="size-2 text-white " />
                //       )}
                //     </div>
                //     <span
                //       className={`text-[14px] font-medium text-[#888B93] ${
                //         todo.completed ? "line-through" : ""
                //       }`}
                //     >
                //       {todo.text}
                //     </span>
                //   </li>
                // )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
