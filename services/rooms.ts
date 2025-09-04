import { v4 as uuidv4 } from "uuid";
import liveblocks from "@/lib/liveblocks";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export async function getRoomData(roomId: string) {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const storage = await liveblocks.getStorageDocument(roomId);

  return storage;
}

export async function initializeInterviewRoom(roomId: string) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  const roomStorage = await liveblocks.getStorageDocument(roomId);
  const questionStorage: any = await liveblocks.getStorageDocument(
    `questions-${orgId}`
  );

  if (Object.keys(roomStorage.data).length > 0) return;

  const questionStorageShapes = questionStorage.data.shapes?.data || [];
  const initialInterviewStorageShapes = questionStorageShapes.map(
    (shape: any) => {
      return {
        liveblocksType: "LiveObject",
        data: {
          ...shape.data,
          id: uuidv4(),
          draftRaw: null,
          metadata: {
            questionId: shape.data.id,
          },
        },
      };
    }
  );

  await liveblocks.initializeStorageDocument(roomId, {
    liveblocksType: "LiveObject",
    data: {
      shapes: {
        liveblocksType: "LiveList",
        data: initialInterviewStorageShapes,
      },
      comments: {
        liveblocksType: "LiveList",
        data: [],
      },
      connections: {
        liveblocksType: "LiveList",
        data: [],
      },
    },
  });
}
