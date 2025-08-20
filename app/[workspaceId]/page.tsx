import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const res = await fetch(
    `http://localhost:3000/api/workspaces/${workspaceId}`
  );
  const workspace = await res.json();

  console.log("workspace:", workspace);

  // const board = await fetchQuery(api.boards.getBoard, {
  //   id: roomId as Id<"boards">,
  // });

  return (
    // <Room roomId={roomId}>
    //   <InfiniteCanvas />
    // </Room>
    <div>
      <div className="flex items-center px-4 h-[46px] bg-white border-b-[0.5px] border-b-[#E4E5ED]">
        <h3>{workspace.name}</h3>
      </div>
      <div></div>
    </div>
  );
}
