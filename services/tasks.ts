"use server";

import { Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export type TaskWithListAndSection = Prisma.TaskGetPayload<{
  include: { task_list: true; section_title: true };
}>;

export async function getTasks() {
  const { orgId, userId } = await auth();

  const tasks = await prisma.task.findMany({
    include: {
      task_list: true,
      section_title: true,
    },
  });

  return tasks;
}

export async function getCompletedTasks() {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) throw new Error("Unauthorized");

  const completedTasks = await prisma.orgTask.findMany({
    where: {
      org_id: orgId,
    },
    include: {
      task: true,
    },
  });

  return completedTasks;
}

export async function updateTask(taskId: number, isComplete: boolean) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) throw new Error("Unauthorized");

  const updateTask = await prisma.orgTask.upsert({
    where: {
      org_id_task_id: {
        org_id: orgId,
        task_id: taskId,
      },
    },
    update: {
      completed: isComplete,
    },
    create: {
      org_id: orgId,
      task_id: taskId,
      completed: isComplete,
    },
  });

  revalidatePath("/");
}
