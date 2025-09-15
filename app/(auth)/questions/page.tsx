import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { auth } from "@clerk/nextjs/server";
import { getValuePropData } from "@/services/questions";
import { ValuePropProvider } from "./_components/ValuePropProvider";

export default async function QuestionsPage() {
  const { orgId } = await auth();

  const valuePropData = await getValuePropData();

  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <ValuePropProvider valuePropData={valuePropData}>
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
        </ValuePropProvider>
      </div>
    </div>
  );
}
