import { auth } from "@clerk/nextjs/server";

import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { generateAnalysisRoom } from "@/services/analysis";

export default async function AnalysysPage() {
  const { orgId } = await auth();

  await generateAnalysisRoom(`analysis-${orgId}`);

  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <Room roomId={`analysis-${orgId}`}>
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
