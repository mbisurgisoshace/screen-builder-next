// components/workspace/SimpleTabs.tsx
"use client";

import { toast } from "sonner";
import React, { useState } from "react";

import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { LoadingText } from "@/components/ui/loader";
import {
  createWorkspaceRoom,
  renameWorkspaceRoom,
} from "@/services/workspaces";

export type SimpleTab = { id: string; title: string; roomId: string };

export default function WorkspaceTabsView({
  rooms,
  workspaceId,
}: {
  rooms: any[];
  workspaceId: string;
}) {
  const [tabs, setTabs] = useState(rooms);
  const [activeRoomId, setActiveRoom] = useState<string | null>(
    rooms[0]?.roomId
  );

  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const beginRename = (id: string, current: string) => {
    setEditingId(id);
    setDraft(current);
  };

  const commitRename = async (id: string, value: string) => {
    const title = (value || "").trim() || "Untitled";
    const prev = tabs.find((t) => t.id === id)?.title ?? "";

    // optimistic update
    setTabs((ts) => ts.map((t) => (t.id === id ? { ...t, title } : t)));
    setEditingId(null);

    try {
      await renameWorkspaceRoom(workspaceId, id, title);
      toast.success("Tab renamed");
    } catch (err) {
      // revert on error
      setTabs((ts) => ts.map((t) => (t.id === id ? { ...t, title: prev } : t)));
      toast.error("Could not rename tab");
    }
  };

  const handleAdd = async () => {
    try {
      const newRoom = await createWorkspaceRoom(workspaceId, rooms.length);
      setActiveRoom(newRoom.roomId);
      toast.success("New room created");
    } catch (err) {
      console.log("err");
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Tabs bar (simple, pill-like; matches your mock vibe) */}
      <div className=" bg-[#ECECEF] h-8">
        <div className="flex gap-2 box-border items-center h-full">
          <div className="flex h-full items-end gap-2 overflow-x-auto px-1">
            {rooms.map((t) => {
              const isEditing = editingId === t.id;
              const active = t.roomId === activeRoomId;

              if (active) {
                if (isEditing) {
                  return (
                    <input
                      autoFocus
                      key={t.id}
                      className="text-[10px] px-1 py-0.5 bg-white border rounded outline-none"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter")
                          (e.target as HTMLInputElement).blur();
                        if (e.key === "Escape") {
                          setEditingId(null);
                          setDraft("");
                        }
                      }}
                      onBlur={() => commitRename(t.roomId, draft)}
                    />
                  );
                }

                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveRoom(t.roomId)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      beginRename(t.id, t.title);
                    }}
                    className="font-semibold cursor-pointer text-[10px] bg-[#F9F9F9] px-3.5 h-6 rounded-t-sm flex items-center"
                  >
                    {t.title}
                  </button>
                );
              }

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
            className="ml-1 cursor-pointer inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
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
          <div className="p-6 flex items-center justify-center min-h-[200px]">
            <LoadingText text="Loading workspace..." />
          </div>
        )}
      </div>
    </div>
  );
}
