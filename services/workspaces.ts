"use server";

import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createWorkspaceRoom(
  workspaceId: string,
  roomIndex: number
) {
  const roomId = uuidv4();

  const newRoom = await prisma.workspaceRoom.create({
    data: {
      roomId,
      workspaceId,
      index: roomIndex,
      title: "Untitled",
    },
  });

  revalidatePath(`/${workspaceId}`);

  return newRoom;
}

export async function renameWorkspaceRoom(
  workspaceId: string,
  roomId: string,
  title: string
) {
  await prisma.workspaceRoom.update({
    where: { roomId },
    data: { title },
  });

  revalidatePath(`/${workspaceId}`);
}
