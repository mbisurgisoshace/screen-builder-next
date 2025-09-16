import { v4 as uuidv4 } from "uuid";
import { redirect } from "next/navigation";

import Todo from "./_components/Todo";
import { getStructuredTodosByOrg, getTodos } from "@/services/todos";
import { Todo as ITodo, TodoType } from "@/lib/generated/prisma";

type StructuredTodos = Array<{
  week: number;
  days: Array<{
    weekday: string;
    weekday_order: number;
    tasks: Array<Task>;
  }>;
}>;

export type Task = {
  task: string;
  task_order: number;
  todos: Array<Todo>;
};

export type Todo = {
  id: string;
  text: string; // task_todo
  description?: string;
  url?: string;
  type: TodoType;
  completed: boolean;
  created_at: Date;
  updated_at: Date;
};

async function formatTodos(todos: ITodo[]): Promise<StructuredTodos> {
  const norm = (s: string) =>
    (s ?? "")
      .normalize("NFKC")
      .replace(/\p{Cf}/gu, "") // quita ZWSP/ZWNJ/ZWJ/BOM, etc.
      .replace(/[\p{Zs}\s]+/gu, " ") // todo tipo de espacios -> 1 espacio
      .trim()
      .toLowerCase();

  const ord = (n: number) =>
    Number.isFinite(n) && n > 0 ? n : Number.MAX_SAFE_INTEGER;

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
                description?: string;
                url?: string;
                type: TodoType;
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

  for (const r of todos) {
    // --- Week ---
    let w = weeksMap.get(r.week);
    if (!w) {
      w = { week: r.week, daysMap: new Map() };
      weeksMap.set(r.week, w);
    }

    // --- Day ---
    const dayKey = `${r.weekday_order}|${r.weekday}`;
    let d = w.daysMap.get(dayKey);
    if (!d) {
      d = {
        weekday: r.weekday,
        weekday_order: r.weekday_order,
        tasksMap: new Map(),
      };
      w.daysMap.set(dayKey, d);
    }

    // --- Task (group only by name) ---
    const taskKey = norm(r.task);
    let t = d.tasksMap.get(taskKey);
    if (!t) {
      t = {
        task: r.task,
        // initialize as Infinity so zeros don’t “win”
        task_order: Number.POSITIVE_INFINITY,
        todos: [],
      };
      d.tasksMap.set(taskKey, t);
    }

    // keep the smallest *positive* order we see; ignore 0
    if (r.task_order > 0) {
      t.task_order = Math.min(t.task_order, r.task_order);
    }

    // --- Todo ---
    t.todos.push({
      id: r.id,
      text: r.task_todo,
      description: r.task_todo_description || undefined,
      url: r.task_todo_url || undefined,
      type: r.type,
      completed: r.completed,
      created_at: r.created_at,
      updated_at: r.updated_at,
    });
  }

  // --- Maps → Arrays + sorting ---
  const result: StructuredTodos = [];
  for (const [, w] of weeksMap) {
    const days = Array.from(w.daysMap.values()).map((d) => {
      const tasks = Array.from(d.tasksMap.values())
        .map((t) => ({
          task: t.task,
          // expose 0 only if no positive order was ever found
          task_order: Number.isFinite(t.task_order) ? t.task_order : 0,
          todos: [...t.todos].sort(
            (a, b) => +new Date(a.created_at) - +new Date(b.created_at)
          ),
        }))
        // sort: explicit orders first (1,2,3...), then any “unset” (0) at the end by name
        .sort(
          (a, b) =>
            ord(a.task_order) - ord(b.task_order) ||
            a.task.localeCompare(b.task)
        );

      return { weekday: d.weekday, weekday_order: d.weekday_order, tasks };
    });

    result.push({ week: w.week, days });
  }

  // defensive final ordering
  result.sort((a, b) => a.week - b.week);
  for (const w of result) {
    w.days.sort((a, b) => a.weekday_order - b.weekday_order);
    for (const d of w.days) {
      d.tasks.sort(
        (a, b) =>
          ord(a.task_order) - ord(b.task_order) || a.task.localeCompare(b.task)
      );
    }
  }

  return result;
}

export default async function Home({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const todos = await getTodos();
  const formattedTodos = await formatTodos(todos);

  return (
    <div className="p-10 w-full pb-20">
      {formattedTodos.map((week) => {
        return (
          <div key={week.week} className="flex gap-6 mb-8">
            {week.days.map((day) => (
              <Todo key={day.weekday} title={day.weekday} todos={day.tasks} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
