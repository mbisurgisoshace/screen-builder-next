import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { QuestionsProvider } from "@/components/CanvasModule/questions/QuestionsProvider";

export default function PickupTruckExamplePage() {
  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <Room roomId={`example-pickup-truck`}>
          <QuestionsProvider segments={[]} questions={[]}>
            <InfiniteCanvas
              editable={false}
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
          </QuestionsProvider>
        </Room>
      </div>
    </div>
  );
}
