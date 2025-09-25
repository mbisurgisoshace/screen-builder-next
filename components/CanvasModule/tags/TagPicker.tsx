// components/CanvasModule/tags/TagPicker.tsx
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTags } from "./TagsProvider";

type Props = {
  value: string[]; // tag names
  onChange: (names: string[]) => void;
};

export const TagPicker: React.FC<Props> = ({ value, onChange }) => {
  const { tags, search, ensure } = useTags();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const setOpenSafely = (o: boolean) => setOpen(o);

  // outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!open) return;
      if (!ref.current || !ref.current.contains(e.target as Node))
        setOpenSafely(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const valueSet = useMemo(
    () => new Set(value.map((n) => n.toLowerCase())),
    [value]
  );
  const suggestions = useMemo(() => {
    const res = search(query);
    return res.filter((t) => !valueSet.has(t.name.toLowerCase()));
  }, [search, query, valueSet]);

  const add = (name: string) => {
    const n = name.trim();
    if (!n) return;
    if (valueSet.has(n.toLowerCase())) return;
    onChange([...value, n]);
    setQuery("");
  };

  const remove = (name: string) => {
    onChange(value.filter((x) => x.toLowerCase() !== name.toLowerCase()));
  };

  const createIfMissing = async () => {
    const n = query.trim();
    if (!n) return;
    const exists = tags.some((t) => t.name.toLowerCase() === n.toLowerCase());
    if (!exists) await ensure(n);
    add(n);
    setOpenSafely(false);
  };

  return (
    <div className="relative" data-nodrag="true">
      <button
        className="px-2 py-1 rounded bg-gray-100 border text-xs w-20"
        onClick={(e) => {
          e.stopPropagation();
          setOpenSafely(!open);
        }}
        title="Add tags"
      >
        Tags ▾
      </button>

      {open && (
        <div
          ref={ref}
          className="absolute z-50 mt-1 w-64 bg-white border rounded-xl shadow p-2"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* selected chips (names are already known) */}
          <div className="flex flex-wrap gap-1 mb-2">
            {value.length ? (
              value.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-white"
                >
                  {name}
                  <button
                    className="text-gray-500"
                    onClick={() => remove(name)}
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">No tags</span>
            )}
          </div>

          {/* search/create */}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createIfMissing();
              if (e.key === "Escape") setOpenSafely(false);
            }}
            placeholder="Search or create…"
            className="w-full mb-2 px-2 py-1 rounded border text-sm outline-none"
          />

          <div className="max-h-[450px] overflow-auto">
            {suggestions.map((t) => (
              <button
                key={t.name}
                className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-sm flex items-center gap-2"
                onClick={() => {
                  add(t.name);
                  setOpenSafely(false);
                }}
              >
                <span
                  className="w-3 h-3 rounded border"
                  style={{ background: t.color || "#fff" }}
                />
                {t.name}
              </button>
            ))}
            {query.trim() && (
              <button
                className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-sm text-blue-600"
                onClick={createIfMissing}
              >
                Create “{query.trim()}”
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
