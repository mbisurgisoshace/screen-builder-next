import { v4 as uuidv4 } from "uuid";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export default async function Home({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    const workspace = await prisma.workspace.create({
      data: {
        name: "Untitled Workspace",
        WorkspaceRoom: {
          create: {
            index: 0,
            roomId: uuidv4(),
            title: "Untitled",
          },
        },
      },
    });

    redirect(`/${workspace.id}`);
  }

  return <div />;
}
