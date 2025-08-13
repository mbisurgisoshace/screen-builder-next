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

  // Local working copy for smooth typing
  const [data, setData] = useState<string[][]>(() =>
    normalizeData(shape.tableData, rows, cols)
  );
  useEffect(() => {
    setData(normalizeData(shape.tableData, rows, cols));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape.tableData, rows, cols]);

  // Grid fills the entire frame: equal-width columns, equal-height rows
  const gridTemplateColumns = useMemo(() => `repeat(${cols}, 1fr)`, [cols]);

  // ==== Row/Col actions (commit immediately) ====
  const addRow = (after = rows - 1) => {
    const i = Math.min(Math.max(after, 0), rows - 1) + 1;
    const next = [
      ...data.slice(0, i),
      Array.from({ length: cols }, () => ""),
      ...data.slice(i),
    ];
    setData(next);
    commit({ tableRows: rows + 1, tableCols: cols, tableData: next });
  };

  const addCol = (after = cols - 1) => {
    const j = Math.min(Math.max(after, 0), cols - 1) + 1;
    const next = data.map((row) => {
      const copy = row.slice();
      copy.splice(j, 0, "");
      return copy;
    });
    setData(next);
    commit({ tableRows: rows, tableCols: cols + 1, tableData: next });
  };

  const removeRow = (index = rows - 1) => {
    if (rows <= 1) return;
    const i = Math.min(Math.max(index, 0), rows - 1);
    const next = data.slice(0, i).concat(data.slice(i + 1));
    setData(next);
    commit({ tableRows: rows - 1, tableCols: cols, tableData: next });
  };

  const removeCol = (index = cols - 1) => {
    if (cols <= 1) return;
    const j = Math.min(Math.max(index, 0), cols - 1);
    const next = data.map((row) => row.slice(0, j).concat(row.slice(j + 1)));
    setData(next);
    commit({ tableRows: rows, tableCols: cols - 1, tableData: next });
  };

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
        {/* Toolbar (stays small; grid below fills rest) */}
        <div
          data-nodrag="true"
          className="px-2 py-1 border-b bg-gray-50 flex items-center gap-2 text-xs"
          // onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            className="px-2 py-1 rounded bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              addRow();
            }}
          >
            + Row
          </button>
          <button
            className="px-2 py-1 rounded bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              addCol();
            }}
          >
            + Col
          </button>
          <button
            className="px-2 py-1 rounded bg-gray-200 disabled:opacity-40"
            disabled={rows <= 1}
            onClick={(e) => {
              e.stopPropagation();
              removeRow();
            }}
          >
            − Row
          </button>
          <button
            className="px-2 py-1 rounded bg-gray-200 disabled:opacity-40"
            disabled={cols <= 1}
            onClick={(e) => {
              e.stopPropagation();
              removeCol();
            }}
          >
            − Col
          </button>
          <span className="ml-2 text-gray-500">
            {rows}×{cols}
          </span>
        </div>

        {/* Grid: fills ALL remaining height/width */}
        <div className="flex-1 p-2 overflow-hidden">
          <div
            className="grid w-full h-full bg-gray-300 gap-[1px] overflow-auto"
            style={{
              gridTemplateColumns,
              gridAutoRows: "1fr", // equal-height rows
            }}
            //onMouseDown={(e) => e.stopPropagation()} // don't start dragging the shape from inside the grid
          >
            {data.map((row, r) =>
              row.map((val, c) => (
                <div key={`${r}-${c}`} className="bg-white min-w-0 min-h-0">
                  <textarea
                    value={val}
                    onChange={(e) => setCell(r, c, e.target.value)}
                    onBlur={commitCell}
                    // prevent shape drag when editing/selecting text
                    //onMouseDown={(e) => e.stopPropagation()}
                    //onKeyDown={(e) => e.stopPropagation()}
                    data-nodrag="true"
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-full h-full p-2 text-sm resize-none bg-transparent outline-none"
                    placeholder=""
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
