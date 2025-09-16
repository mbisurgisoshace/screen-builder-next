"use client";

import { Task } from "@/lib/generated/prisma";
import LinkTodo from "./LinkTodo";
import ImageTodo from "./ImageTodo";
import VideoTodo from "./VideoTodo";
import ModalTodo from "./ModalTodo";
import { updateTask } from "@/services/tasks";
import ScheduleTodo from "./ScheduleTodo";

interface TaskProps {
  task: Task;
  isCompleted: boolean;
  data: Record<string, any>;
}

export default function TaskCard({ task, data, isCompleted }: TaskProps) {
  const markAsComplete = async (
    id: number,
    complete: boolean,
    data?: Record<string, any>
  ) => {
    //await updateTodo(id, { completed: complete });
    await updateTask(id, complete, data);
  };

  const renderTodo = (todo: Task) => {
    if (todo.task_type === "text") {
      //return <span key={todo.id}>Text</span>;
      return null;
    }

    if (todo.task_type === "schedule") {
      return (
        <ScheduleTodo
          data={data}
          todo={todo}
          key={todo.id}
          markAsComplete={markAsComplete}
          isCompleted={isCompleted}
        />
      );
    }

    if (todo.task_type === "link") {
      return (
        <LinkTodo
          key={todo.id}
          todo={todo}
          markAsComplete={markAsComplete}
          isCompleted={isCompleted}
        />
      );
    }

    if (todo.task_type === "modal") {
      return (
        <ModalTodo
          key={todo.id}
          todo={todo}
          markAsComplete={markAsComplete}
          isCompleted={isCompleted}
        />
      );
    }

    if (todo.task_type === "image") {
      return (
        <ImageTodo
          key={todo.id}
          todo={todo}
          markAsComplete={markAsComplete}
          isCompleted={isCompleted}
        />
      );
    }

    if (todo.task_type === "video") {
      return (
        <VideoTodo
          key={todo.id}
          todo={todo}
          markAsComplete={markAsComplete}
          isCompleted={isCompleted}
        />
      );
    }
  };

  return renderTodo(task);
}
