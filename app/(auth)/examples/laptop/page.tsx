import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { QuestionsProvider } from "@/components/CanvasModule/questions/QuestionsProvider";

export default function LaptopExamplePage() {
  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <Room roomId={`example-laptop`}>
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
                card: true,
              }}
            />
          </QuestionsProvider>
        </Room>
      </div>
    </div>
  );
}
