// components/workspace/SimpleTabs.tsx
"use client";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { Room } from "@/components/Room";
import React from "react";

export type SimpleTab = { id: string; title: string; roomId: string };

export default function WorkspaceTabsView({ rooms }: { rooms: any[] }) {
  const [activeRoomId, setActiveRoom] = React.useState<string | null>(
    rooms[0].roomId
  );

  const handleAdd = () => {};

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Tabs bar (simple, pill-like; matches your mock vibe) */}
      <div className=" bg-[#ECECEF] h-8">
        <div className="flex gap-2 box-border items-center h-full">
          <div className="flex h-full items-end gap-2 overflow-x-auto px-1">
            {rooms.map((t) => {
              const active = t.roomId === activeRoomId;

              if (active)
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveRoom(t.roomId)}
                    className="font-semibold cursor-pointer text-[10px] bg-[#F9F9F9] px-3.5 h-6 rounded-t-sm flex items-center"
                  >
                    {t.title}
                  </button>
                );

              return (
                <button
                  key={t.id}
                  onClick={() => setActiveRoom(t.roomId)}
                  className="font-semibold cursor-pointer text-[10px] text-[#111827]  opacity-60 px-3.5 h-6 rounded-t-sm flex items-center"
                >
                  {t.title}
                </button>
              );
            })}
          </div>

          <button
            title="New tab"
            onClick={handleAdd}
            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content area fills the rest of the viewport */}
      <div className="relative flex-1 w-full h-full">
        {activeRoomId ? (
          <div className="absolute inset-0 w-full h-full">
            <Room roomId={activeRoomId}>
              <InfiniteCanvas />
            </Room>
          </div>
        ) : (
          <div className="p-6 text-gray-500">Loading…</div>
        )}
      </div>
    </div>
  );
}
