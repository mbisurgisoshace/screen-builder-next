import { prisma } from "@/lib/prisma";
import { Room } from "@/components/Room";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { initializeInterviewRoom } from "@/services/rooms";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ participantId: string }>;
}) {
  const { orgId } = await auth();
  const { participantId } = await params;

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { ParticipantRoom: true },
  });

  const roomId = participant?.ParticipantRoom?.roomId;

  if (!roomId) return redirect("/participants");

  await initializeInterviewRoom(roomId);

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
