"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";
import { useRegisterToolbarExtras } from "../toolbar/toolbarExtrasStore";

type Props = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  onCommitTable?: (id: string, patch: Partial<IShape>) => void;
};

type FontStyle = "normal" | "bold" | "italic";
type Scope = "cell" | "row" | "col";

const PALETTE = [
  "#ffffff",
  "#f8fafc",
  "#fee2e2",
  "#ffedd5",
  "#fef3c7",
  "#dcfce7",
  "#dbeafe",
  "#e9d5ff",
  "#fce7f3",
  "#000000",
]; // shared by BG & Text
const FONT_SIZES = [12, 14, 16, 18, 20, 24];

function makeEmpty<T>(rows: number, cols: number, v: T): T[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => v)
  );
}
function normalizeGrid<T>(
  grid: T[][] | undefined,
  rows: number,
  cols: number,
  fill: T
): T[][] {
  let g = Array.isArray(grid) ? grid.map((r) => r.slice()) : [];
  if (g.length < rows)
    g = g.concat(
      makeEmpty(rows - g.length, Math.max(cols, g[0]?.length ?? cols), fill)
    );
  if (g.length > rows) g = g.slice(0, rows);
  for (let r = 0; r < g.length; r++) {
    const row = g[r];
    if (row.length < cols)
      g[r] = row.concat(Array.from({ length: cols - row.length }, () => fill));
    if (row.length > cols) g[r] = row.slice(0, cols);
  }
  return g;
}
function normalizeData(
  data: string[][] | undefined,
  rows: number,
  cols: number
) {
  return normalizeGrid<string>(data, rows, cols, "");
}

export const Table: React.FC<Props> = (props) => {
  const { shape, onCommitTable } = props;
  const commit = (patch: Partial<IShape>) => onCommitTable?.(shape.id, patch);

  const rows = Math.max(1, shape.tableRows ?? 3);
  const cols = Math.max(1, shape.tableCols ?? 3);

  // Local mirrors
  const [data, setData] = useState<string[][]>(() =>
    normalizeData(shape.tableData, rows, cols)
  );
  const [bg, setBg] = useState<string[][]>(() =>
    normalizeGrid<string>(shape.tableBg, rows, cols, "#ffffff")
  );
  const [font, setFont] = useState<FontStyle[][]>(() =>
    normalizeGrid<FontStyle>(shape.tableFont, rows, cols, "normal")
  );
  const [fg, setFg] = useState<string[][]>(() =>
    normalizeGrid<string>(shape.tableFontColor, rows, cols, "#0f172a")
  );
  const [fs, setFs] = useState<number[][]>(() =>
    normalizeGrid<number>(shape.tableFontSize, rows, cols, 14)
  );

  useEffect(() => {
    setData(normalizeData(shape.tableData, rows, cols));
    setBg(normalizeGrid<string>(shape.tableBg, rows, cols, "#ffffff"));
    setFont(normalizeGrid<FontStyle>(shape.tableFont, rows, cols, "normal"));
    setFg(normalizeGrid<string>(shape.tableFontColor, rows, cols, "#0f172a"));
    setFs(normalizeGrid<number>(shape.tableFontSize, rows, cols, 14));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    shape.tableData,
    shape.tableBg,
    shape.tableFont,
    shape.tableFontColor,
    shape.tableFontSize,
    rows,
    cols,
  ]);

  // Active & scope
  const [active, setActive] = useState<{ r: number; c: number } | null>(null);
  const [scope, setScope] = useState<Scope>("cell");

  // Popover state
  const [openPicker, setOpenPicker] = useState<null | "bg" | "fg" | "size">(
    null
  );
  const toolbarRef = useRef<HTMLDivElement>(null);

  useRegisterToolbarExtras(
    shape.id,
    () => (
      <>
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

        {/* Scope */}
        <div className="flex items-center gap-1">
          <span className="text-gray-500">Apply to</span>
          <div className="inline-flex rounded-lg overflow-hidden border">
            {(["cell", "row", "col"] as Scope[]).map((s) => (
              <button
                key={s}
                className={`px-2 py-1 ${
                  scope === s ? "bg-blue-200" : "bg-gray-100"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setScope(s);
                }}
              >
                {s === "cell" ? "Cell" : s === "row" ? "Row" : "Col"}
              </button>
            ))}
          </div>
        </div>

        {/* Color pickers (popover) */}
        <div className="flex items-center gap-2">
          {/* BG */}
          <div className="relative">
            <button
              className="px-2 py-1 rounded bg-gray-100 border flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                setOpenPicker(openPicker === "bg" ? null : "bg");
              }}
            >
              <span className="text-gray-500">BG</span>
              <span
                className="w-4 h-4 rounded border"
                style={{
                  backgroundColor: active ? bg[active.r][active.c] : "#ffffff",
                }}
              />
            </button>
            {openPicker === "bg" && (
              <PalettePopover onPick={(c) => applyBg(c)} />
            )}
          </div>

          {/* Text */}
          <div className="relative">
            <button
              className="px-2 py-1 rounded bg-gray-100 border flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                setOpenPicker(openPicker === "fg" ? null : "fg");
              }}
            >
              <span className="text-gray-500">Text</span>
              <span
                className="w-4 h-4 rounded border grid place-items-center"
                style={{ color: active ? fg[active.r][active.c] : "#0f172a" }}
              >
                A
              </span>
            </button>
            {openPicker === "fg" && (
              <PalettePopover onPick={(c) => applyFg(c)} />
            )}
          </div>
        </div>

        {/* Font style */}
        <div className="flex items-center gap-1">
          <span className="text-gray-500">Style</span>
          <button
            className="px-2 py-1 rounded bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              applyFontStyle("normal");
            }}
          >
            N
          </button>
          <button
            className="px-2 py-1 rounded bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              applyFontStyle("bold");
            }}
          >
            <span className="font-bold">B</span>
          </button>
          <button
            className="px-2 py-1 rounded bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              applyFontStyle("italic");
            }}
          >
            <span className="italic">I</span>
          </button>
        </div>
      </>
    ),
    [shape.id, scope, font, bg, fg, fs, openPicker, rows, cols]
  );

  // Close popover on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!openPicker) return;
      if (!toolbarRef.current) return setOpenPicker(null);
      if (!toolbarRef.current.contains(e.target as Node)) setOpenPicker(null);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [openPicker]);

  // Focus helpers (nice UX after ops)
  const cellRefs = useRef<Map<string, HTMLTextAreaElement | null>>(new Map());
  const setCellRef =
    (r: number, c: number) => (el: HTMLTextAreaElement | null) => {
      cellRefs.current.set(`${r}-${c}`, el);
    };
  const focusCell = (r: number, c: number) => {
    setTimeout(() => {
      const el = cellRefs.current.get(`${r}-${c}`);
      if (el) {
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    }, 0);
  };

  const gridTemplateColumns = useMemo(() => `repeat(${cols}, 1fr)`, [cols]);

  // ---- insert/remove helpers (keep all grids in sync) ----
  const insertRowAt = (i: number) => {
    const idx = Math.max(0, Math.min(i, rows));
    const emptyRow = Array.from({ length: cols }, () => "");
    const emptyBg = Array.from({ length: cols }, () => "#ffffff");
    const emptyFont = Array.from({ length: cols }, () => "normal" as const);
    const emptyFg = Array.from({ length: cols }, () => "#0f172a");
    const emptyFs = Array.from({ length: cols }, () => 14);

    const nextData = [...data.slice(0, idx), emptyRow, ...data.slice(idx)];
    const nextBg = [...bg.slice(0, idx), emptyBg, ...bg.slice(idx)];
    const nextFont = [...font.slice(0, idx), emptyFont, ...font.slice(idx)];
    const nextFg = [...fg.slice(0, idx), emptyFg, ...fg.slice(idx)];
    const nextFs = [...fs.slice(0, idx), emptyFs, ...fs.slice(idx)];

    setData(nextData);
    setBg(nextBg);
    setFont(nextFont);
    setFg(nextFg);
    setFs(nextFs);
    commit({
      tableRows: rows + 1,
      tableCols: cols,
      tableData: nextData,
      tableBg: nextBg,
      tableFont: nextFont,
      tableFontColor: nextFg,
      tableFontSize: nextFs,
    });
    const newR = idx,
      newC = active ? Math.min(active.c, cols - 1) : 0;
    setActive({ r: newR, c: newC });
    focusCell(newR, newC);
  };

  const insertColAt = (j: number) => {
    const idx = Math.max(0, Math.min(j, cols));
    const nextData = data.map((row) => {
      const copy = row.slice();
      copy.splice(idx, 0, "");
      return copy;
    });
    const nextBg = bg.map((row) => {
      const copy = row.slice();
      copy.splice(idx, 0, "#ffffff");
      return copy;
    });
    const nextFont = font.map((row) => {
      const copy = row.slice();
      copy.splice(idx, 0, "normal");
      return copy;
    });
    const nextFg = fg.map((row) => {
      const copy = row.slice();
      copy.splice(idx, 0, "#0f172a");
      return copy;
    });
    const nextFs = fs.map((row) => {
      const copy = row.slice();
      copy.splice(idx, 0, 14);
      return copy;
    });

    setData(nextData);
    setBg(nextBg);
    setFont(nextFont);
    setFg(nextFg);
    setFs(nextFs);
    commit({
      tableRows: rows,
      tableCols: cols + 1,
      tableData: nextData,
      tableBg: nextBg,
      tableFont: nextFont,
      tableFontColor: nextFg,
      tableFontSize: nextFs,
    });
    const newR = active ? Math.min(active.r, rows - 1) : 0,
      newC = idx;
    setActive({ r: newR, c: newC });
    focusCell(newR, newC);
  };

  const removeRowAt = (i: number) => {
    if (rows <= 1) return;
    const idx = Math.max(0, Math.min(i, rows - 1));
    const nextData = data.slice(0, idx).concat(data.slice(idx + 1));
    const nextBg = bg.slice(0, idx).concat(bg.slice(idx + 1));
    const nextFont = font.slice(0, idx).concat(font.slice(idx + 1));
    const nextFg = fg.slice(0, idx).concat(fg.slice(idx + 1));
    const nextFs = fs.slice(0, idx).concat(fs.slice(idx + 1));

    setData(nextData);
    setBg(nextBg);
    setFont(nextFont);
    setFg(nextFg);
    setFs(nextFs);
    commit({
      tableRows: rows - 1,
      tableCols: cols,
      tableData: nextData,
      tableBg: nextBg,
      tableFont: nextFont,
      tableFontColor: nextFg,
      tableFontSize: nextFs,
    });
    if (!nextData.length) return setActive(null);
    const newR = Math.min(idx, rows - 2),
      newC = active ? Math.min(active.c, cols - 1) : 0;
    setActive({ r: newR, c: newC });
    focusCell(newR, newC);
  };

  const removeColAt = (j: number) => {
    if (cols <= 1) return;
    const idx = Math.max(0, Math.min(j, cols - 1));
    const nextData = data.map((row) =>
      row.slice(0, idx).concat(row.slice(idx + 1))
    );
    const nextBg = bg.map((row) =>
      row.slice(0, idx).concat(row.slice(idx + 1))
    );
    const nextFont = font.map((row) =>
      row.slice(0, idx).concat(row.slice(idx + 1))
    );
    const nextFg = fg.map((row) =>
      row.slice(0, idx).concat(row.slice(idx + 1))
    );
    const nextFs = fs.map((row) =>
      row.slice(0, idx).concat(row.slice(idx + 1))
    );

    setData(nextData);
    setBg(nextBg);
    setFont(nextFont);
    setFg(nextFg);
    setFs(nextFs);
    commit({
      tableRows: rows,
      tableCols: cols - 1,
      tableData: nextData,
      tableBg: nextBg,
      tableFont: nextFont,
      tableFontColor: nextFg,
      tableFontSize: nextFs,
    });

    const newC = Math.min(idx, cols - 2),
      newR = active ? Math.min(active.r, rows - 1) : 0;
    setActive({ r: newR, c: Math.max(0, newC) });
    focusCell(newR, Math.max(0, newC));
  };

  // Toolbar actions (contextual to active)
  const addRowAbove = () => insertRowAt(active ? active.r : 0);
  const addRowBelow = () => insertRowAt((active ? active.r : rows - 1) + 1);
  const addColLeft = () => insertColAt(active ? active.c : 0);
  const addColRight = () => insertColAt((active ? active.c : cols - 1) + 1);
  const removeRow = () => removeRowAt(active ? active.r : rows - 1);
  const removeCol = () => removeColAt(active ? active.c : cols - 1);

  // Cell text + commit
  const setCell = (r: number, c: number, text: string) => {
    setData((prev) => {
      const next = prev.map((row) => row.slice());
      next[r][c] = text;
      return next;
    });
  };
  const commitCell = () => commit({ tableData: data });

  // Apply helpers (scope-aware)
  const applyBg = (color: string) => {
    if (!active) return;
    setBg((prev) => {
      const next = prev.map((row) => row.slice());
      if (scope === "cell") next[active.r][active.c] = color;
      else if (scope === "row")
        for (let j = 0; j < cols; j++) next[active.r][j] = color;
      else for (let i = 0; i < rows; i++) next[i][active.c] = color;
      commit({ tableBg: next });
      return next;
    });
    setOpenPicker(null);
  };

  const applyFg = (color: string) => {
    if (!active) return;
    setFg((prev) => {
      const next = prev.map((row) => row.slice());
      if (scope === "cell") next[active.r][active.c] = color;
      else if (scope === "row")
        for (let j = 0; j < cols; j++) next[active.r][j] = color;
      else for (let i = 0; i < rows; i++) next[i][active.c] = color;
      commit({ tableFontColor: next });
      return next;
    });
    setOpenPicker(null);
  };

  const applyFontStyle = (style: FontStyle) => {
    if (!active) return;
    setFont((prev) => {
      const next = prev.map((row) => row.slice());
      if (scope === "cell") next[active.r][active.c] = style;
      else if (scope === "row")
        for (let j = 0; j < cols; j++) next[active.r][j] = style;
      else for (let i = 0; i < rows; i++) next[i][active.c] = style;
      commit({ tableFont: next });
      return next;
    });
  };

  const applyFontSize = (size: number) => {
    if (!active) return;
    setFs((prev) => {
      const next = prev.map((row) => row.slice());
      if (scope === "cell") next[active.r][active.c] = size;
      else if (scope === "row")
        for (let j = 0; j < cols; j++) next[active.r][j] = size;
      else for (let i = 0; i < rows; i++) next[i][active.c] = size;
      commit({ tableFontSize: next });
      return next;
    });
    setOpenPicker(null);
  };

  // Keyboard handlers
  function handleKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    r: number,
    c: number
  ) {
    if (e.key === "Enter" && e.altKey) return;
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        if (c > 0) moveTo(r, c - 1);
        else if (r > 0) moveTo(r - 1, cols - 1);
      } else {
        if (c < cols - 1) moveTo(r, c + 1);
        else if (r < rows - 1) moveTo(r + 1, 0);
        else {
          insertRowAt(rows);
          setTimeout(() => moveTo(rows, 0), 0);
        }
      }
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        if (r > 0) moveTo(r - 1, c);
      } else {
        if (r < rows - 1) moveTo(r + 1, c);
        else {
          insertRowAt(rows);
          setTimeout(() => moveTo(rows, c), 0);
        }
      }
    }
  }
  function moveTo(r: number, c: number) {
    const nr = Math.max(0, Math.min(r, rows - 1));
    const nc = Math.max(0, Math.min(c, cols - 1));
    setActive({ r: nr, c: nc });
    focusCell(nr, nc);
  }

  // // Keyboard nav (same as before)
  // const moveTo = (r: number, c: number) => {
  //   const nr = Math.max(0, Math.min(r, rows - 1));
  //   const nc = Math.max(0, Math.min(c, cols - 1));
  //   setActive({ r: nr, c: nc });
  //   focusCell(nr, nc);
  // };
  // const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, r: number, c: number) => {
  //   if (e.key === "Enter" && e.altKey) return;
  //   if (e.key === "Tab") {
  //     e.preventDefault();
  //     if (e.shiftKey) { if (c > 0) moveTo(r, c - 1); else if (r > 0) moveTo(r - 1, cols - 1); }
  //     else { if (c < cols - 1) moveTo(r, c + 1); else if (r < rows - 1) moveTo(r + 1, 0); else { insertRowAt(rows); setTimeout(() => moveTo(rows, 0), 0); } }
  //     return;
  //   }
  //   if (e.key === "Enter") {
  //     e.preventDefault();
  //     if (e.shiftKey) { if (r > 0) moveTo(r - 1, c); }
  //     else { if (r < rows - 1) moveTo(r + 1, c); else { insertRowAt(rows); setTimeout(() => moveTo(rows, c), 0); } }
  //     return;
  //   }
  // };

  return (
    <ShapeFrame
      {...props}
      resizable={true}
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      <div className="w-full h-full bg-white rounded-xl shadow flex flex-col overflow-hidden">
        {/* Grid */}
        <div className="flex-1 p-2 overflow-hidden">
          <div
            className="grid w-full h-full bg-gray-300 gap-[1px]"
            style={{ gridTemplateColumns, gridAutoRows: "1fr" }}
          >
            {data.map((row, r) =>
              row.map((val, c) => {
                const cellBg = bg[r][c] || "#ffffff";
                const cellFont = font[r][c] || "normal";
                const cellFg = fg[r][c] || "#0f172a";
                const cellFs = fs[r][c] || 14;
                const fontWeight = cellFont === "bold" ? 700 : 400;
                const fontStyle = cellFont === "italic" ? "italic" : "normal";
                const ring = active
                  ? scope === "cell"
                    ? active.r === r && active.c === c
                    : scope === "row"
                    ? active.r === r
                    : active.c === c
                  : false;
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`min-w-0 min-h-0 ${
                      ring ? "ring-1 ring-blue-300" : ""
                    }`}
                    style={{ backgroundColor: cellBg }}
                  >
                    <textarea
                      ref={setCellRef(r, c)}
                      value={val}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      onBlur={commitCell}
                      onFocus={() => setActive({ r, c })}
                      onClick={() => setActive({ r, c })}
                      data-nodrag="true"
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        handleKeyDown(e, r, c);
                      }}
                      className="w-full h-full p-2 text-sm resize-none bg-transparent outline-none"
                      style={{
                        color: cellFg,
                        fontWeight,
                        fontStyle,
                        fontSize: `${cellFs}px`,
                      }}
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

// Small, self-contained color palette popover
function PalettePopover({ onPick }: { onPick: (c: string) => void }) {
  return (
    <div
      className="absolute w-max top-full left-0 mt-1 z-50 p-2 bg-white border rounded-xl shadow grid grid-cols-5 gap-1"
      data-nodrag="true"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {PALETTE.map((c) => (
        <button
          key={c}
          title={c}
          className="w-6 h-6 rounded border hover:scale-105 transition"
          style={{ backgroundColor: c }}
          onClick={(e) => {
            e.stopPropagation();
            onPick(c);
          }}
        />
      ))}
    </div>
  );
}

function SizePopover({
  sizes,
  onPick,
}: {
  sizes: number[];
  onPick: (s: number) => void;
}) {
  return (
    <div
      className="absolute w-max top-full left-0 mt-1 z-50 p-2 bg-white border rounded-xl shadow grid grid-cols-3 gap-1"
      data-nodrag="true"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {sizes.map((s) => (
        <button
          key={s}
          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          onClick={(e) => {
            e.stopPropagation();
            onPick(s);
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
