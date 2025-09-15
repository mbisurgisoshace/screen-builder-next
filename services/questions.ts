import liveblocks from "@/lib/liveblocks";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function getQuestions() {
  const { orgId } = await auth();

  const questions: any = await liveblocks.getStorageDocument(
    `questions-${orgId}`
  );

  return questions;
}

export async function getValuePropData() {
  const { orgId } = await auth();

  if (!orgId) return;

  const valuePropostion = await prisma.valuePropositionVersion.findFirst({
    where: { org_id: orgId },
    orderBy: { created_at: "desc" },
  });

  if (!valuePropostion) return;

  const valuePropositionRoomId = valuePropostion.room_id;

  const valuePropositionData = await liveblocks.getStorageDocument(
    valuePropositionRoomId
  );

  //@ts-ignore
  return valuePropositionData.data?.shapes?.data.map((s) => s.data);
}
