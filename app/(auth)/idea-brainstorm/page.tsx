import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { auth } from "@clerk/nextjs/server";
import {
  createBrainstormExampleCards,
  initializeExampleCards,
} from "@/services/rooms";

export default async function IdeaBrainstormPage() {
  const { orgId } = await auth();

  await initializeExampleCards(
    `brainstorm-${orgId}`,
    createBrainstormExampleCards
  );

  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <Room roomId={`brainstorm-${orgId}`}>
          <InfiniteCanvas
            toolbarOptions={{
              text: true,
              card: false,
              table: false,
              answer: false,
              ellipse: true,
              feature: true,
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
