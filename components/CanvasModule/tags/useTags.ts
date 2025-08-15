// components/CanvasModule/tags/useTags.ts
"use client";
import { useEffect, useMemo, useState } from "react";

export type Tag = { id: string; name: string; color: string | null };

export function useTagSearch(query: string) {
  const [tags, setTags] = useState<Tag[]>([]);
  useEffect(() => {
    let alive = true;
    const q = query.trim();
    const url = q ? `/api/tags?q=${encodeURIComponent(q)}` : `/api/tags`;
    const t = setTimeout(async () => {
      const r = await fetch(url);
      if (!alive) return;
      const j = await r.json();
      setTags(j.tags || []);
    }, 120); // small debounce
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);
  return tags;
}

export async function ensureTag(name: string, color?: string): Promise<Tag> {
  const r = await fetch("/api/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, color }),
  });
  if (!r.ok) throw new Error("Failed to create/find tag");
  const j = await r.json();
  return j.tag as Tag;
}

export async function fetchTagsByIds(ids: string[]): Promise<Tag[]> {
  if (!ids.length) return [];
  const r = await fetch(`/api/tags?ids=${ids.join(",")}`);
  const j = await r.json();
  return j.tags || [];
}
