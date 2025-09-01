"use client";

import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { LiveList, LiveObject } from "@liveblocks/client";
import { useMutation, useStorage } from "@liveblocks/react";

export type RoomComment = {
  id: string;
  text: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  createdAt: number;
  updatedAt?: number;
};

function getList(storage: any, createIfMissing = false) {
  let list = storage.get("comments") as LiveList<
    LiveObject<RoomComment>
  > | null;
  if (!list && createIfMissing) {
    list = new LiveList<LiveObject<RoomComment>>([]);
    storage.set("comments", list);
  }
  return list;
}

export function useRealtimeComments() {
  const comments: RoomComment[] =
    useStorage((root) => {
      const list = root.comments;
      if (!list) return [];
      return list
        .map((c: any) => c as RoomComment)
        .sort((a, b) => b.createdAt - a.createdAt);
    }) ?? [];

  //   // Ensure list exists once this hook mounts
  //   const ensureList = useMutation(({ storage }) => {
  //     getList(storage, true);
  //   }, []);
  //   useEffect(() => {
  //     ensureList();
  //   }, [ensureList]);

  const addComment = useMutation(
    (
      { storage },
      c: Omit<RoomComment, "id" | "createdAt"> & { id?: string }
    ) => {
      const list = getList(storage, true)!;
      const comment: RoomComment = {
        id: uuidv4(),
        text: c.text,
        authorId: c.authorId,
        authorName: c.authorName,
        authorAvatar: c.authorAvatar,
        createdAt: Date.now(),
      };
      list.push(new LiveObject<RoomComment>(comment));
    },
    []
  );

  const removeComment = useMutation(({ storage }, id: string) => {
    const list = getList(storage);
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
      const lo = list.get(i)!;
      if (lo.get("id") === id) {
        list.delete(i);
        return;
      }
    }
  }, []);

  const editComment = useMutation(
    ({ storage }, id: string, fields: Partial<RoomComment>) => {
      const list = getList(storage);
      if (!list) return;
      for (let i = 0; i < list.length; i++) {
        const lo = list.get(i)!;
        if (lo.get("id") === id) {
          lo.update({ ...fields, updatedAt: Date.now() });
          return;
        }
      }
    },
    []
  );

  return { comments, addComment, removeComment, editComment };
}
