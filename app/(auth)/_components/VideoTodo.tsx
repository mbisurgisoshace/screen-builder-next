import { CheckIcon } from "lucide-react";
import { Todo } from "../page";

interface VideoTodoProps {
  todo: Todo;
  markAsComplete: (id: string, complete: boolean) => Promise<void>;
}

export default function VideoTodo({ todo, markAsComplete }: VideoTodoProps) {

  console.log("todo>>", todo);

  return (
    <li
      key={todo.id}
      className={`text-[#B5BCCB] border-[0.5px] border-[#B5BCCC] rounded-[8px] px-[12px] py-[12px] flex flex-col gap-2 ${todo.completed ? "bg-[#E4E5ED66]" : ""
        }`}
    >
      <div className="flex flex-row gap-3.5 items-center">
        <div
          className={`size-5 rounded-full text-[#B5BCCC] border border-[#B5BCCC] flex items-center justify-center ${todo.completed ? "bg-[#42BC5C] border-[#42BC5C]" : "border"
            }`}
          onClick={() => {
            markAsComplete(todo.id, !todo.completed);
          }}
        >
          {todo.completed && <CheckIcon className="size-2 text-white " />}
        </div>
        <span
          className={`text-[16px] font-bold text-[#111827] ${todo.completed ? "line-through" : ""
            }`}
        >
          {todo.text}
        </span>
      </div>
      <div className="flex flex-col gap-5 pl-[0px]">
        <h3
          className={`text-[14px] font-medium text-[#2E3545] pl-8 ${todo.completed ? "line-through" : ""
            }`}
        >
          {todo.description}
        </h3>
        {todo.url.includes("youtube.com") ? (
          <iframe
            className="w-full rounded-[10px]"
            height="315"
            src={todo.url.replace("watch?v=", "embed/")}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            controls
            src={todo.url}
            className="w-full bg-cover rounded-[10px]"
          />
        )}

      </div>
    </li>
  );
}
