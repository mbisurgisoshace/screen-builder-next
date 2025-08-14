"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";

type Props = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  onCommitTable?: (id: string, patch: Partial<IShape>) => void;
};

function makeEmptyData(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => "")
  );
}

function normalizeData(
  data: string[][] | undefined,
  rows: number,
  cols: number
) {
  let d = Array.isArray(data) ? data.map((r) => r.slice()) : [];
  if (d.length < rows)
    d = d.concat(
      makeEmptyData(rows - d.length, Math.max(cols, d[0]?.length ?? cols))
    );
  if (d.length > rows) d = d.slice(0, rows);
  for (let r = 0; r < d.length; r++) {
    const row = d[r];
    if (row.length < cols)
      d[r] = row.concat(Array.from({ length: cols - row.length }, () => ""));
    if (row.length > cols) d[r] = row.slice(0, cols);
  }
  return d;
}

export const Table: React.FC<Props> = (props) => {
  const { shape, onCommitTable } = props;
  const commit = (patch: Partial<IShape>) => onCommitTable?.(shape.id, patch);

  const rows = Math.max(1, shape.tableRows ?? 3);
  const cols = Math.max(1, shape.tableCols ?? 3);

  // Local working copy for smooth typing
  const [data, setData] = useState<string[][]>(() =>
    normalizeData(shape.tableData, rows, cols)
  );
  useEffect(() => {
    setData(normalizeData(shape.tableData, rows, cols));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape.tableData, rows, cols]);

  // Active cell drives contextual operations (insert left/right/above/below, remove current)
  const [active, setActive] = useState<{ r: number; c: number } | null>(null);

  // Grid fills the entire frame: equal-width columns, equal-height rows
  const gridTemplateColumns = useMemo(() => `repeat(${cols}, 1fr)`, [cols]);

  // ---- helpers: insert/remove at index ----
  const insertRowAt = (i: number) => {
    const idx = Math.max(0, Math.min(i, rows)); // allow inserting at end (rows)
    const next = [
      ...data.slice(0, idx),
      Array.from({ length: cols }, () => ""),
      ...data.slice(idx),
    ];
    setData(next);
    commit({ tableRows: rows + 1, tableCols: cols, tableData: next });
    setActive({ r: idx, c: active ? Math.min(active.c, cols - 1) : 0 });
  };

  const insertColAt = (j: number) => {
    const idx = Math.max(0, Math.min(j, cols)); // allow inserting at end (cols)
    const next = data.map((row) => {
      const copy = row.slice();
      copy.splice(idx, 0, "");
      return copy;
    });
    setData(next);
    commit({ tableRows: rows, tableCols: cols + 1, tableData: next });
    setActive({ r: active ? Math.min(active.r, rows - 1) : 0, c: idx });
  };

  const removeRowAt = (i: number) => {
    if (rows <= 1) return;
    const idx = Math.max(0, Math.min(i, rows - 1));
    const next = data.slice(0, idx).concat(data.slice(idx + 1));
    setData(next);
    commit({ tableRows: rows - 1, tableCols: cols, tableData: next });
    if (!next.length) return setActive(null);
    const newR = Math.min(idx, rows - 2);
    setActive({ r: newR, c: active ? Math.min(active.c, cols - 1) : 0 });
  };

  const removeColAt = (j: number) => {
    if (cols <= 1) return;
    const idx = Math.max(0, Math.min(j, cols - 1));
    const next = data.map((row) =>
      row.slice(0, idx).concat(row.slice(idx + 1))
    );
    setData(next);
    commit({ tableRows: rows, tableCols: cols - 1, tableData: next });
    const newC = Math.min(idx, cols - 2);
    setActive({ r: active ? Math.min(active.r, rows - 1) : 0, c: newC });
  };

  // ---- toolbar actions (contextual to active cell) ----
  const addRowAbove = () => insertRowAt(active ? active.r : 0); // if none active, add at top
  const addRowBelow = () => insertRowAt((active ? active.r : rows - 1) + 1); // if none, add at bottom
  const addColLeft = () => insertColAt(active ? active.c : 0); // if none, add at left
  const addColRight = () => insertColAt((active ? active.c : cols - 1) + 1); // if none, add at right
  const removeRow = () => removeRowAt(active ? active.r : rows - 1);
  const removeCol = () => removeColAt(active ? active.c : cols - 1);

  // ==== Cell editing ====
  const setCell = (r: number, c: number, text: string) => {
    setData((prev) => {
      const next = prev.map((row) => row.slice());
      next[r][c] = text;
      return next;
    });
  };

  const commitCell = () => {
    // Commit whole table on blur for simplicity and fewer storage writes
    commit({ tableData: data });
  };

  return (
    <ShapeFrame
      {...props}
      resizable={true}
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      {/* Full-size container */}
      <div className="w-full h-full bg-white rounded-xl shadow flex flex-col overflow-hidden">
        {/* Toolbar — bubble for selection; no-drag to avoid starting shape drag */}
        <div
          data-nodrag="true"
          className="px-2 py-1 border-b bg-gray-50 flex items-center gap-3 text-xs"
        >
          {/* Rows */}
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Row</span>
            <button
              className="px-2 py-1 rounded bg-gray-200"
              title="Add above"
              onClick={(e) => {
                e.stopPropagation();
                addRowAbove();
              }}
            >
              + ↑
            </button>
            <button
              className="px-2 py-1 rounded bg-gray-200"
              title="Add below"
              onClick={(e) => {
                e.stopPropagation();
                addRowBelow();
              }}
            >
              + ↓
            </button>
            <button
              className="px-2 py-1 rounded bg-gray-200 disabled:opacity-40"
              disabled={rows <= 1}
              title="Remove row"
              onClick={(e) => {
                e.stopPropagation();
                removeRow();
              }}
            >
              −
            </button>
          </div>

          {/* Columns */}
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Col</span>
            <button
              className="px-2 py-1 rounded bg-gray-200"
              title="Add left"
              onClick={(e) => {
                e.stopPropagation();
                addColLeft();
              }}
            >
              + ←
            </button>
            <button
              className="px-2 py-1 rounded bg-gray-200"
              title="Add right"
              onClick={(e) => {
                e.stopPropagation();
                addColRight();
              }}
            >
              + →
            </button>
            <button
              className="px-2 py-1 rounded bg-gray-200 disabled:opacity-40"
              disabled={cols <= 1}
              title="Remove column"
              onClick={(e) => {
                e.stopPropagation();
                removeCol();
              }}
            >
              −
            </button>
          </div>

          <span className="ml-1 text-gray-500">
            {rows}×{cols}
            {active ? ` — r${active.r + 1}·c${active.c + 1}` : ""}
          </span>
        </div>

        {/* Grid: fills ALL remaining height/width */}
        <div className="flex-1 p-2 overflow-hidden">
          <div
            className="grid w-full h-full bg-gray-300 gap-[1px] "
            style={{ gridTemplateColumns, gridAutoRows: "1fr" }}
          >
            {data.map((row, r) =>
              row.map((val, c) => {
                const isActive = active && active.r === r && active.c === c;
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`bg-white min-w-0 min-h-0 ${
                      isActive ? "ring-1 ring-blue-300" : ""
                    }`}
                  >
                    <textarea
                      value={val}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      onBlur={commitCell}
                      onFocus={() => setActive({ r, c })}
                      onClick={() => setActive({ r, c })}
                      // prevent shape drag while editing
                      data-nodrag="true"
                      onKeyDown={(e) => e.stopPropagation()}
                      className="w-full h-full p-2 text-sm resize-none bg-transparent outline-none"
                      placeholder=""
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </ShapeFrame>
  );
};
