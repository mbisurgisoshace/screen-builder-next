import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { auth } from "@clerk/nextjs/server";
import {
  createSegmentExampleCards,
  initializeExampleCards,
} from "@/services/rooms";

export default async function SegmentsPage() {
  const { orgId } = await auth();

  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <Room roomId={`screen-${orgId}`}>
          <InfiniteCanvas
            toolbarOptions={{
              text: false,
              card: false,
              table: false,
              answer: false,
              ellipse: false,
              feature: false,
              question: false,
              rectangle: false,
              interview: false,
            }}
          />
        </Room>
      </div>
    </div>
  );
}
