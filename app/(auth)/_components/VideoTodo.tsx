import { Task } from "@/lib/generated/prisma";
import { CheckIcon } from "lucide-react";

interface VideoTodoProps {
  todo: Task;
  isCompleted: boolean;
  markAsComplete: (id: number, complete: boolean) => Promise<void>;
}

export default function VideoTodo({
  todo,
  isCompleted,
  markAsComplete,
}: VideoTodoProps) {
  console.log("todo>>", todo);

  return (
    <li
      key={todo.id}
      className={`text-[#B5BCCB] border-[0.5px] border-[#B5BCCC] rounded-[8px] flex flex-col gap-2 ${
        isCompleted ? "bg-[#E4E5ED66]" : ""
      }`}
    >
      <div className="flex flex-row gap-3.5 items-center px-[12px] py-[12px]">
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
      <div className="flex flex-col gap-5 pl-[0px]">
        <h3
          className={`text-[14px] font-medium text-[#2E3545] pl-12 break-words overflow-wrap-anywhere ${
            isCompleted ? "line-through" : ""
          }`}
          dangerouslySetInnerHTML={{ __html: todo.task_description || "" }}
        />
      </div>
      {todo.task_url?.includes("youtube.com") ? (
        <div className="w-full aspect-video rounded-[8px] overflow-hidden px-[12px] py-[12px]">
          <iframe
            className="w-full h-full rounded-[8px]"
            src={todo.task_url?.replace("watch?v=", "embed/")}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : todo.task_url?.includes("vimeo.com") ? (
        <div className="w-full aspect-video rounded-[8px] overflow-hidden px-[12px] py-[12px]">
          <iframe
            className="w-full h-full rounded-[8px]"
            src={`https://player.vimeo.com/video/${todo.task_url?.split('/').pop()}`}
            title="Vimeo video player"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <video
          controls
          src={todo.task_url!}
          className="w-full aspect-video object-cover rounded-[10px] px-[12px] py-[12px]"
        />
      )}
    </li>
  );
}
