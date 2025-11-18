import { LayoutGridColumns } from "../types";

type GridColumnsOverlayProps = {
  width: number;
  height: number;
  grid: LayoutGridColumns;
};

export function GridColumnsOverlay({
  width,
  height,
  grid,
}: GridColumnsOverlayProps) {
  const { enabled, count, gutter, margin } = grid;

  if (!enabled || count <= 0 || width <= 0 || height <= 0) return null;

  const contentWidth = width - margin * 2;
  if (contentWidth <= 0) return null;

  const totalGutterWidth = gutter * (count - 1);
  const columnWidth = (contentWidth - totalGutterWidth) / count;

  // Safety guard, avoid NaN / negative
  if (columnWidth <= 0) return null;

  const columns = Array.from({ length: count }, (_, i) => {
    const left = margin + i * (columnWidth + gutter);
    return { left, width: columnWidth };
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      {columns.map((col, index) => (
        <div
          key={index}
          style={{
            zIndex: 50,
            position: "absolute",
            left: col.left,
            top: 0,
            width: col.width,
            height,
            background: "rgba(255, 0, 0, 0.08)", // soft red
            boxSizing: "border-box",
          }}
        />
      ))}
    </div>
  );
}
