import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { auth } from "@clerk/nextjs/server";
import {
  createSegmentExampleCards,
  initializeExampleCards,
} from "@/services/rooms";

export default async function SegmentsPage() {
  const { orgId } = await auth();

  await initializeExampleCards(`segments-${orgId}`, createSegmentExampleCards);

  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <Room roomId={`segments-${orgId}`}>
          <InfiniteCanvas
            toolbarOptions={{
              text: true,
              card: true,
              table: false,
              answer: false,
              ellipse: true,
              feature: false,
              question: false,
              rectangle: true,
              interview: false,
            }}
          />
        </Room>
      </div>
    </div>
  );
}
