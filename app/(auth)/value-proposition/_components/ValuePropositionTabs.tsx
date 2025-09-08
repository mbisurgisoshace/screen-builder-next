// components/workspace/SimpleTabs.tsx
"use client";

import { toast } from "sonner";
import React, { useState } from "react";

import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import {
  createWorkspaceRoom,
  renameWorkspaceRoom,
} from "@/services/workspaces";

export type SimpleTab = { id: string; title: string; roomId: string };

export default function ValuePropositionTabsView({ rooms }: { rooms: any[] }) {
  const [tabs, setTabs] = useState(rooms);
  const [activeRoomId, setActiveRoom] = useState<string | null>(
    rooms[0].room_id
  );

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Tabs bar (simple, pill-like; matches your mock vibe) */}
      <div className=" bg-[#ECECEF] h-8">
        <div className="flex gap-2 box-border items-center h-full">
          <div className="flex h-full items-end gap-2 overflow-x-auto px-1">
            {rooms.map((t) => {
              const active = t.room_id === activeRoomId;

              if (active) {
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveRoom(t.room_id)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="font-semibold cursor-pointer text-[10px] bg-[#F9F9F9] px-3.5 h-6 rounded-t-sm flex items-center"
                  >
                    {`Version ${t.version_number}`}
                  </button>
                );
              }

              return (
                <button
                  key={t.id}
                  onClick={() => setActiveRoom(t.roomId)}
                  className="font-semibold cursor-pointer text-[10px] text-[#111827]  opacity-60 px-3.5 h-6 rounded-t-sm flex items-center"
                >
                  {`Version ${t.version_number}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content area fills the rest of the viewport */}
      <div className="relative flex-1 w-full h-full">
        {activeRoomId ? (
          <div className="absolute inset-0 w-full h-full">
            <Room roomId={activeRoomId}>
              <InfiniteCanvas
                toolbarOptions={{
                  answer: false,
                  question: false,
                  card: true,
                  text: true,
                  rectangle: true,
                  ellipse: true,
                  feature: false,
                  interview: false,
                  table: false,
                }}
              />
            </Room>
          </div>
        ) : (
          <div className="p-6 text-gray-500">Loading…</div>
        )}
      </div>
    </div>
  );
}
