import { v4 as uuidv4 } from "uuid";
import { redirect } from "next/navigation";

import {
  Todo as ITodo,
  Task,
  TaskList,
  TaskSectionTitle,
  TodoType,
} from "@/lib/generated/prisma";
import {
  getCompletedTasks,
  getTasks,
  TaskWithListAndSection,
} from "@/services/tasks";
import TaskCard from "./_components/Task";

type GroupedTasks = Array<{
  task_list: TaskList;
  sections: Array<{
    section_title: TaskSectionTitle;
    tasks: TaskWithListAndSection[];
  }>;
}>;

export default async function Home({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tasks = await getTasks();
  const completedTasks = await getCompletedTasks();
  const groupedTasks = groupTasksByListAndSection(tasks || []);

  return (
    <div className="flex flex-row p-10 gap-6 w-full pb-20">
      {groupedTasks.map((taskList) => {
        return (
          <div
            key={taskList.task_list.id}
            className="border-2 bg-white border-white rounded-[12px] w-[300px] min-w-[300px] overflow-y-auto h-full max-h-600"
          >
            <div className="px-[22px] py-[15px] bg-[#7559C3]">
              <h3 className="text-[14px] font-semibold text-white">
                {taskList.task_list.title}
              </h3>
            </div>
            <div className="px-[12px] py-[12px] flex flex-col gap-4">
              {taskList.sections.map((section) => (
                <div key={section.section_title.id}>
                  <h5 className="text-[14px] text-[#111827] font-medium opacity-70 mb-3">
                    {section.section_title.title}
                  </h5>
                  <ul className="flex gap-1 flex-col">
                    {section.tasks.map((task) => {
                      const isCompleted = completedTasks.some(
                        (ct) => ct.task_id === task.id && ct.completed
                      );
                      const completedTask = completedTasks.find(
                        (task) => task.id === task.id
                      );
                      return (
                        <TaskCard
                          task={task}
                          key={task.id}
                          isCompleted={isCompleted}
                          data={
                            completedTask
                              ? (completedTask.data as Record<string, any>)
                              : {}
                          }
                        />
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function groupTasksByListAndSection(
  tasks: TaskWithListAndSection[]
): GroupedTasks {
  // First, build nested maps to avoid O(n^2) scans
  const listMap = new Map<
    number,
    {
      task_list: TaskList;
      sections: Map<
        number | null,
        {
          section_title: TaskSectionTitle;
          tasks: Task[];
        }
      >;
    }
  >();

  for (const t of tasks) {
    const tl = t.task_list!;
    if (!listMap.has(tl.id)) {
      listMap.set(tl.id, {
        task_list: tl,
        sections: new Map(),
      });
    }
    const listEntry = listMap.get(tl.id)!;

    const st = t.section_title ?? null; // allow null/undefined
    const sectionKey = st?.id ?? null;

    if (!listEntry.sections.has(sectionKey)) {
      listEntry.sections.set(sectionKey, {
        section_title: st ?? {
          id: null as any,
          title: "Unsectioned",
          order: Number.MAX_SAFE_INTEGER,
        },
        tasks: [],
      });
    }
    listEntry.sections.get(sectionKey)!.tasks.push(t);
  }

  // Now materialize into sorted arrays
  //@ts-ignore
  const result: GroupedTasks = Array.from(listMap.values())
    .sort((a, b) => (a.task_list.order ?? 0) - (b.task_list.order ?? 0))
    .map(({ task_list, sections }) => ({
      task_list,
      sections: Array.from(sections.values())
        .sort(
          (a, b) => (a.section_title.order ?? 0) - (b.section_title.order ?? 0)
        )
        .map(({ section_title, tasks }) => ({
          section_title,
          tasks: tasks.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        })),
    }));

  return result;
}
