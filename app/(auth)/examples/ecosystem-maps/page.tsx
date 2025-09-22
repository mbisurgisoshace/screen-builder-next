import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";

export default function EcosystemMapExamples() {
  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <Room roomId={`example-ecosystem-map`}>
          <InfiniteCanvas
            editable={true}
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
        </Room>
      </div>
    </div>
  );
}
