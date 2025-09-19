"use server";

import liveblocks from "@/lib/liveblocks";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function getSegments() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  await liveblocks.getOrCreateRoom(`segments-${orgId}`, {
    defaultAccesses: [],
  });

  const segmentsData = await liveblocks.getStorageDocument(`segments-${orgId}`);

  //@ts-ignore
  const segments = segmentsData.data?.shapes?.data
    .map((s: any) => s.data)
    .filter((s: any) => s.subtype === "industry_market_segment_card");

  return segments;
}
