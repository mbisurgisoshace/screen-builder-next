"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  // rows
  if (d.length < rows)
    d = d.concat(
      makeEmptyData(rows - d.length, Math.max(cols, d[0]?.length ?? cols))
    );
  if (d.length > rows) d = d.slice(0, rows);
  // cols
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

  // Local working copy (keeps UX snappy; we commit on blur / structure changes)
  const [data, setData] = useState<string[][]>(() =>
    normalizeData(shape.tableData, rows, cols)
  );
  useEffect(() => {
    setData(normalizeData(shape.tableData, rows, cols));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape.tableData, rows, cols]);

  // Track selected cell (for delete-target or adding after)
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);

  // --- Actions ---
  const addRow = (afterIndex?: number) => {
    const i = typeof afterIndex === "number" ? afterIndex + 1 : data.length;
    const next = [
      ...data.slice(0, i),
      Array.from({ length: cols }, () => ""),
      ...data.slice(i),
    ];
    setData(next);
    commit({ tableRows: next.length, tableCols: cols, tableData: next });
  };

  const addCol = (afterIndex?: number) => {
    const j = typeof afterIndex === "number" ? afterIndex + 1 : cols;
    const next = data.map((row) => {
      const copy = row.slice();
      copy.splice(j, 0, "");
      return copy;
    });
    setData(next);
    commit({ tableRows: rows, tableCols: cols + 1, tableData: next });
  };

  const removeRow = (index?: number) => {
    if (rows <= 1) return;
    const i = typeof index === "number" ? index : data.length - 1;
    const next = data.slice(0, i).concat(data.slice(i + 1));
    setData(next);
    commit({ tableRows: rows - 1, tableCols: cols, tableData: next });
    if (sel && sel.r >= next.length)
      setSel({ r: next.length - 1, c: Math.min(sel.c, cols - 1) });
  };

  const removeCol = (index?: number) => {
    if (cols <= 1) return;
    const j = typeof index === "number" ? index : cols - 1;
    const next = data.map((row) => row.slice(0, j).concat(row.slice(j + 1)));
    setData(next);
    commit({ tableRows: rows, tableCols: cols - 1, tableData: next });
    if (sel && sel.c >= cols - 1)
      setSel({ r: Math.min(sel.r, rows - 1), c: cols - 2 });
  };

  // Cell change: we update local and commit on blur
  const handleCellInput = (r: number, c: number, text: string) => {
    setData((prev) => {
      const next = prev.map((row) => row.slice());
      next[r][c] = text;
      return next;
    });
  };
  const handleCellBlur = (r: number, c: number) => {
    commit({ tableData: data }); // commit whole table for simplicity
  };

  // Grid styles
  const gridTemplateColumns = useMemo(
    () => `repeat(${cols}, minmax(80px, 1fr))`,
    [cols]
  );

  return (
    <ShapeFrame
      {...props}
      resizable={true}
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      <div className="w-full h-full bg-white rounded-xl shadow flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div
          className="px-2 py-1 border-b bg-gray-50 flex items-center gap-2 text-xs"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            className="px-2 py-1 rounded bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              addRow(sel?.r);
            }}
            title="Add row"
          >
            + Row
          </button>
          <button
            className="px-2 py-1 rounded bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              addCol(sel?.c);
            }}
            title="Add column"
          >
            + Col
          </button>
          <button
            className="px-2 py-1 rounded bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              removeRow(sel?.r);
            }}
            title="Remove row"
            disabled={rows <= 1}
          >
            − Row
          </button>
          <button
            className="px-2 py-1 rounded bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              removeCol(sel?.c);
            }}
            title="Remove column"
            disabled={cols <= 1}
          >
            − Col
          </button>
          {sel && (
            <span className="ml-2 text-gray-500">
              Cell: {sel.r + 1}×{sel.c + 1}
            </span>
          )}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto p-2">
          <div
            className="grid gap-[1px] bg-gray-300"
            style={{ gridTemplateColumns }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {data.map((row, r) =>
              row.map((val, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`bg-white min-h-[32px] relative ${
                    sel && sel.r === r && sel.c === c
                      ? "outline outline-2 outline-blue-400"
                      : ""
                  }`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSel({ r, c });
                  }}
                >
                  <div
                    role="textbox"
                    contentEditable
                    suppressContentEditableWarning
                    className="px-2 py-1 text-sm outline-none"
                    onMouseDown={(e) => e.stopPropagation()}
                    onInput={(e) =>
                      handleCellInput(
                        r,
                        c,
                        (e.currentTarget as HTMLDivElement).innerText
                      )
                    }
                    onBlur={() => handleCellBlur(r, c)}
                    // initialize content
                    dangerouslySetInnerHTML={{ __html: escapeHtml(val) }}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ShapeFrame>
  );
};

// Simple escape to avoid interpreting < & > as tags inside contentEditable
function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
