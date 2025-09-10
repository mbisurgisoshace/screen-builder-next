import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { auth } from "@clerk/nextjs/server";

export default async function IdeaBrainstormPage() {
  const { orgId } = await auth();

  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <Room roomId={`brainstorm-${orgId}`}>
          <InfiniteCanvas
            toolbarOptions={{
              text: true,
              table: false,
              answer: false,
              ellipse: true,
              feature: false,
              question: false,
              rectangle: true,
              interview: false,
              card: false,
            }}
          />
        </Room>
      </div>
    </div>
  );
}
