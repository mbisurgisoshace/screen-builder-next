"use client";

import { Task } from "@/lib/generated/prisma";
import LinkTodo from "./LinkTodo";
import ImageTodo from "./ImageTodo";
import VideoTodo from "./VideoTodo";
import ModalTodo from "./ModalTodo";
import { updateTask } from "@/services/tasks";

interface TaskProps {
  task: Task;
  isCompleted: boolean;
}

export default function TaskCard({ task, isCompleted }: TaskProps) {
  console.log("TaskCard Rendered with task:", task);

  const markAsComplete = async (id: number, complete: boolean) => {
    //await updateTodo(id, { completed: complete });
    await updateTask(id, complete);
  };

  const renderTodo = (todo: Task) => {
    if (todo.task_type === "text") {
      //return <span key={todo.id}>Text</span>;
      return null;
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
