import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { auth } from "@clerk/nextjs/server";

export default async function EcosystemPage() {
  const { orgId } = await auth();

  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <Room roomId={`ecosystem-${orgId}`}>
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
