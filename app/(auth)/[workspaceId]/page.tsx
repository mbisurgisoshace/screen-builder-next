import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import WorkspaceTabsView from "./_components/WorkspaceTabs";
import { prisma } from "@/lib/prisma";
import { QuestionsProvider } from "@/components/CanvasModule/questions/QuestionsProvider";
import { UserButton } from "@clerk/nextjs";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { WorkspaceRoom: { orderBy: { index: "asc" } } },
  });

  const questions = await prisma.cardQuestions.findMany({});

  // const board = await fetchQuery(api.boards.getBoard, {
  //   id: roomId as Id<"boards">,
  // });

  return (
    // <Room roomId={roomId}>
    //   <InfiniteCanvas />
    // </Room>
    <div className="flex flex-col h-full">
      {/* <div className="flex items-center px-4 h-[46px] bg-white border-b-[0.5px] border-b-[#E4E5ED] justify-between">
        <h3>{workspace?.name}</h3>
        <UserButton />
      </div> */}
      <div className="h-full">
        <QuestionsProvider questions={questions} segments={[]}>
          <WorkspaceTabsView
            workspaceId={workspaceId}
            rooms={workspace?.WorkspaceRoom || []}
          />
        </QuestionsProvider>
      </div>
    </div>
  );
}
