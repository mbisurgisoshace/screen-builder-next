import { v4 as uuidv4 } from "uuid";
import liveblocks from "@/lib/liveblocks";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { LiveList, LiveObject } from "@liveblocks/client";
import { Shape } from "@/components/CanvasModule/types";

export async function getRoomData(roomId: string) {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const storage = await liveblocks.getStorageDocument(roomId);

  return storage;
}

export async function initializeInterviewRoom(roomId: string) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  await liveblocks.getOrCreateRoom(roomId, {
    defaultAccesses: [],
  });

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
            questionDate: new Date().toDateString(),
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

export async function initializeExampleCards(
  roomId: string,
  createExamples: () => LiveList<LiveObject<any>>
) {
  const roomStorage = await liveblocks.getStorageDocument(roomId);

  //@ts-ignore
  const hasExample = hasExampleCards(roomStorage.data.shapes.data as any[]);

  if (!hasExample) {
    const exampleCards = await createExamples();
    await liveblocks.mutateStorage(roomId, ({ root }) => {
      const shapes = root.get("shapes");
      exampleCards.forEach((card) => {
        shapes.push(
          new LiveObject({
            ...card.toObject(),
          })
        );
      });
    });
  }
}

export function hasExampleCards(shapes: any[]) {
  return shapes.some(
    (shape) =>
      shape.data.subtype?.includes("example") ||
      shape.data.type?.includes("example")
  );
}

export function createSegmentExampleCards() {
  const shapes: LiveList<LiveObject<any>> = new LiveList([]);
  shapes.push(
    new LiveObject({
      id: uuidv4(),
      type: "card",
      x: 100,
      y: 100,
      width: 997,
      height: 450,
      subtype: "example_segment_card",
    })
  );

  return shapes;
}

export function createBrainstormExampleCards() {
  const shapes: LiveList<LiveObject<any>> = new LiveList([]);
  shapes.push(
    new LiveObject({
      id: uuidv4(),
      type: "example_brainstorm_card",
      x: 100,
      y: 100,
      width: 997,
      height: 450,
      subtype: null,
    })
  );

  return shapes;
}
