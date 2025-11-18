type BoxModelOverlayProps = {
  width: number;
  height: number;
  padding?: number;
  margin?: number;
};

export function BoxModelOverlay({
  width,
  height,
  padding = 0,
  margin = 0,
}: BoxModelOverlayProps) {
  const contentLeft = 0;
  const contentTop = 0;

  const marginRect = {
    x: contentLeft - margin,
    y: contentTop - margin,
    w: width + margin * 2,
    h: height + margin * 2,
  };

  const paddingRect = {
    x: contentLeft + padding,
    y: contentTop + padding,
    w: width - padding * 2,
    h: height - padding * 2,
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none", // 👈 important
      }}
    >
      {/* Margin (orange) */}
      {margin > 0 && (
        <div
          style={{
            position: "absolute",
            left: marginRect.x,
            top: marginRect.y,
            width: marginRect.w,
            height: marginRect.h,
            background: "rgba(255, 165, 0, 0.17)", // light orange
            border: "1px solid rgba(255, 165, 0, 0.9)",
            boxSizing: "border-box",
          }}
        />
      )}

      {/* Padding (green) */}
      {padding > 0 && (
        <div
          style={{
            zIndex: 50,
            position: "absolute",
            left: paddingRect.x,
            top: paddingRect.y,
            width: paddingRect.w,
            height: paddingRect.h,
            background: "rgba(0, 255, 0, 0.15)", // light green
            border: "1px dashed rgba(0, 180, 0, 0.9)",
            boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );
}
