"use server";

import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import liveblocks from "@/lib/liveblocks";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getValuePropositionVersions() {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  const valuePropositionVersions =
    await prisma.valuePropositionVersion.findMany({
      where: {
        org_id: orgId,
      },
      orderBy: {
        created_at: "desc",
      },
    });

  return valuePropositionVersions;
}

export async function createValuePropositionVersion() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const versions = await prisma.valuePropositionVersion.count();

  const newVersion = await prisma.valuePropositionVersion.create({
    data: {
      org_id: orgId,
      room_id: uuidv4(),
      version_number: versions + 1,
    },
  });

  revalidatePath(`/value-proposition`);

  return newVersion;
}

export async function getSegmentsPropData() {
  const { orgId } = await auth();

  if (!orgId) return;

  const roomId = `segments-${orgId}`;

  await liveblocks.getOrCreateRoom(roomId, {
    defaultAccesses: [],
  });

  const segmentsData = await liveblocks.getStorageDocument(roomId);

  //@ts-ignore
  return segmentsData.data?.shapes?.data.map((s) => s.data);
}
