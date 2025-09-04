import liveblocks from "@/lib/liveblocks";
import { auth } from "@clerk/nextjs/server";

export async function getQuestions() {
  const { orgId } = await auth();

  const questions: any = await liveblocks.getStorageDocument(
    `questions-${orgId}`
  );

  return questions;
}
