import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { auth } from "@clerk/nextjs/server";

export default async function QuestionsPage() {
  const { orgId } = await auth();

  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <Room roomId={`questions-${orgId}`}>
          <InfiniteCanvas
            toolbarOptions={{
              text: false,
              table: false,
              answer: false,
              ellipse: false,
              feature: false,
              question: true,
              rectangle: false,
              interview: false,
              card: false,
            }}
          />
        </Room>
      </div>
    </div>
  );
}
