import { v4 as uuidv4 } from "uuid";
import { redirect } from "next/navigation";

import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";

export default async function Home({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    const boardId = uuidv4();
    redirect(`/${boardId}`);
  }

  return <div />;
}
