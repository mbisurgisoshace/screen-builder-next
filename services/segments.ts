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
    .filter(
      (s: any) =>
        s.subtype === "industry_market_segment_card" ||
        s.subtype === "customer_card" ||
        s.subtype === "end_user_card"
    );

  //@ts-ignore
  const industryMarketSegments = segments.filter(
    (s: any) => s.subtype === "industry_market_segment_card"
  );
  //@ts-ignore
  const customers = segments.filter((s: any) => s.subtype === "customer_card");
  //@ts-ignore
  const endUsers = segments.filter((s: any) => s.subtype === "end_user_card");

  const formattedSegmentsData = [
    { title: "Market", data: industryMarketSegments },
    { title: "Customer", data: customers },
    { title: "End User", data: endUsers },
  ];

  return formattedSegmentsData;
}
