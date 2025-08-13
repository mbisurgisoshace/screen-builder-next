import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  // const board = await fetchQuery(api.boards.getBoard, {
  //   id: roomId as Id<"boards">,
  // });

  return (
    <Room roomId={roomId}>
      <InfiniteCanvas />
    </Room>
  );
}
