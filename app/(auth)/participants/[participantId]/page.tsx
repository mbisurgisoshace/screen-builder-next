import { prisma } from "@/lib/prisma";
import { Room } from "@/components/Room";
import { redirect } from "next/navigation";
import InfiniteCanvas from "@/components/InfiniteCanvas";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ participantId: string }>;
}) {
  const { participantId } = await params;

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { ParticipantRoom: true },
  });

  const roomId = participant?.ParticipantRoom?.roomId;

  if (!roomId) return redirect("/participants");

  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <Room roomId={roomId}>
          <InfiniteCanvas />
        </Room>
      </div>
    </div>
  );
}
