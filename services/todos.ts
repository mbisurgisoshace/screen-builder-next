"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Todo } from "@/lib/generated/prisma";
import { revalidatePath } from "next/cache";

export async function getTodos() {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  const todos = await prisma.todo.findMany({
    where: {
      org_id: orgId,
    },
    orderBy: [{ week: "asc" }, { weekday_order: "asc" }, { task_order: "asc" }],
  });

  return todos;
}

export async function updateTodo(id: string, data: Partial<Todo>) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  const updatedTodo = await prisma.todo.update({
    where: {
      id,
    },
    data,
  });

  revalidatePath("/");

  return updatedTodo;
}

type StructuredTodos = Array<{
  week: number;
  days: Array<{
    weekday: string;
    weekday_order: number;
    tasks: Array<{
      task: string;
      task_order: number;
      todos: Array<{
        id: string;
        text: string; // task_todo
        completed: boolean;
        created_at: Date;
        updated_at: Date;
      }>;
    }>;
  }>;
}>;

/**
 * Returns todos grouped as:
 * [
 *   { week, days: [
 *      { weekday, weekday_order, tasks: [
 *         { task, task_order, todos: [...] }
 *      ] }
 *   ] }
 * ]
 */
export async function getStructuredTodosByOrg(): Promise<StructuredTodos> {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  // 1) Pull rows in the exact order we want to render
  const rows = await prisma.todo.findMany({
    where: { org_id: orgId },
    orderBy: [
      { week: "asc" },
      { weekday_order: "asc" },
      { task_order: "asc" },
      // No explicit todo order column, so use creation time
      { created_at: "asc" },
    ],
  });

  // 2) Build hierarchy in a single pass using Maps for O(1) grouping
  const weeksMap = new Map<
    number,
    {
      week: number;
      daysMap: Map<
        string,
        {
          weekday: string;
          weekday_order: number;
          tasksMap: Map<
            string,
            {
              task: string;
              task_order: number;
              todos: Array<{
                id: string;
                text: string;
                completed: boolean;
                created_at: Date;
                updated_at: Date;
              }>;
            }
          >;
        }
      >;
    }
  >();

  for (const r of rows) {
    // Week
    let weekEntry = weeksMap.get(r.week);
    if (!weekEntry) {
      weekEntry = {
        week: r.week,
        daysMap: new Map(),
      };
      weeksMap.set(r.week, weekEntry);
    }

    // Day (keyed by order + name to be safe)
    const dayKey = `${r.weekday_order}|${r.weekday}`;
    let dayEntry = weekEntry.daysMap.get(dayKey);
    if (!dayEntry) {
      dayEntry = {
        weekday: r.weekday,
        weekday_order: r.weekday_order,
        tasksMap: new Map(),
      };
      weekEntry.daysMap.set(dayKey, dayEntry);
    }

    // Task (keyed by order + name to be safe)
    const taskKey = `${r.task_order}|${r.task}`;
    let taskEntry = dayEntry.tasksMap.get(taskKey);
    if (!taskEntry) {
      taskEntry = {
        task: r.task,
        task_order: r.task_order,
        todos: [],
      };
      dayEntry.tasksMap.set(taskKey, taskEntry);
    }

    // Todo
    taskEntry.todos.push({
      id: r.id,
      text: r.task_todo,
      completed: r.completed,
      created_at: r.created_at,
      updated_at: r.updated_at,
    });
  }

  // 3) Convert Maps → Arrays preserving the insertion order (already sorted by query)
  const result: StructuredTodos = [];
  for (const [, w] of weeksMap) {
    const days = Array.from(w.daysMap.values()).map((d) => {
      const tasks = Array.from(d.tasksMap.values()).map((t) => ({
        task: t.task,
        task_order: t.task_order,
        todos: t.todos, // already ordered by created_at asc
      }));

      return {
        weekday: d.weekday,
        weekday_order: d.weekday_order,
        tasks,
      };
    });

    result.push({
      week: w.week,
      days,
    });
  }

  // (Optional) If you want to be extra-safe with ordering regardless of DB sort:
  result.sort((a, b) => a.week - b.week);
  for (const w of result) {
    w.days.sort((a, b) => a.weekday_order - b.weekday_order);
    for (const d of w.days) {
      d.tasks.sort((a, b) => a.task_order - b.task_order);
      // todos already in created_at ascending
    }
  }

  console.log("result", result);

  return result;
}
