"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { useAuth } from "@clerk/nextjs";

export type Tag = { name: string; color: string | null };

type Ctx = {
  tags: Tag[];
  ready: boolean;
  search: (q: string) => Tag[];
  ensure: (name: string, color?: string) => Promise<Tag>;
  refresh: () => Promise<void>;
};

const TagsContext = createContext<Ctx | null>(null);

const norm = (s: string) => s.trim().toLowerCase();

export const TagsProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { orgId } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/tags", { cache: "no-store" });
    if (!r.ok) return;
    const j = await r.json();
    const list: Tag[] = j.tags || [];
    setTags(list.sort((a, b) => a.name.localeCompare(b.name)));
    setReady(true);
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---- Realtime subscription (singleton, with status logs) ----
  const subscribedRef = useRef(false);
  useEffect(() => {
    if (subscribedRef.current) return; // guard duplicate subscribe (StrictMode)
    subscribedRef.current = true;

    const supabase = getBrowserSupabase();

    // Helper mutations
    const upsert = (arr: Tag[], t: Tag) => {
      const i = arr.findIndex((x) => norm(x.name) === norm(t.name));
      if (i === -1)
        return [...arr, t].sort((a, b) => a.name.localeCompare(b.name));
      const next = arr.slice();
      next[i] = t;
      return next.sort((a, b) => a.name.localeCompare(b.name));
    };
    const removeByName = (arr: Tag[], name: string) =>
      arr.filter((x) => norm(x.name) !== norm(name));

    const channel = supabase
      .channel("realtime:tags")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tags" },
        (payload) => {
          if (payload.new.org_id !== orgId) return;

          const t: Tag = {
            name: payload.new.name,
            color: payload.new.color ?? null,
          };
          setTags((prev) => upsert(prev, t));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tags" },
        (payload) => {
          if (payload.new.org_id !== orgId) return;

          const t: Tag = {
            name: payload.new.name,
            color: payload.new.color ?? null,
          };
          setTags((prev) => upsert(removeByName(prev, payload.old.name), t));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "tags" },

        (payload) => {
          if (payload.old.org_id !== orgId) return;
          setTags((prev) => removeByName(prev, payload.old.name));
        }
      )
      .subscribe((status) => {
        // Handy debug: look for "SUBSCRIBED"
        // eslint-disable-next-line no-console
        console.log("[tags realtime] status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
      subscribedRef.current = false;
    };
  }, []);

  // POST via Prisma route; optimistic add + fallback refresh
  const ensure = useCallback(
    async (name: string, color?: string) => {
      const n = name.trim();
      if (!n) throw new Error("Empty name");
      const r = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, color }),
      });
      if (!r.ok) throw new Error("Failed to create/find tag");
      const j = await r.json();
      const t: Tag = j.tag;

      // Optimistic (in case Realtime takes a tick)
      setTags((prev) => {
        const exists = prev.some((x) => norm(x.name) === norm(n));
        return exists
          ? prev
          : [...prev, t].sort((a, b) => a.name.localeCompare(b.name));
      });

      // Safety net: if we don't see an INSERT within ~2s, refresh once
      setTimeout(() => {
        setTags((prev) => {
          const stillMissing = !prev.some((x) => norm(x.name) === norm(n));
          if (stillMissing) refresh();
          return prev;
        });
      }, 2000);

      return t;
    },
    [refresh]
  );

  const search = useCallback(
    (q: string) => {
      const needle = q.trim().toLowerCase();
      if (!needle) return tags;
      return tags.filter((t) => t.name.toLowerCase().includes(needle));
    },
    [tags]
  );

  const value = useMemo<Ctx>(
    () => ({ tags, ready, search, ensure, refresh }),
    [tags, ready, search, ensure, refresh]
  );

  return <TagsContext.Provider value={value}>{children}</TagsContext.Provider>;
};

export function useTags() {
  const ctx = useContext(TagsContext);
  if (!ctx) throw new Error("useTags must be used within <TagsProvider>");
  return ctx;
}
