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
    const res = await fetch("http://localhost:3000/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "My Workspace" }),
    });
    const workspace = await res.json();

    redirect(`/${workspace.id}`);
  }

  return <div />;
}
