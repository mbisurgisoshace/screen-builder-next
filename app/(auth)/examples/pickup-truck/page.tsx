import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";

export default function PickupTruckExamplePage() {
  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <Room roomId={`example-pickup-truck`}>
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
        </Room>
      </div>
    </div>
  );
}
