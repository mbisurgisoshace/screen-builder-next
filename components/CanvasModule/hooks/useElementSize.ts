import { useCallback, useEffect, useState } from "react";

type Size = { width: number; height: number };

type Options = {
  /** Qué caja observar: "border-box" | "content-box" | "device-pixel-content-box" */
  box?: ResizeObserverBoxOptions;
  /** Callback opcional cada vez que cambie el tamaño */
  onChange?: (size: Size) => void;
};

/**
 * useElementSize
 * Observa cambios de tamaño del elemento y expone { width, height }.
 *
 * Uso:
 *   const { ref, width, height } = useElementSize<HTMLDivElement>();
 *   return <div ref={ref}>...</div>
 */
export function useElementSize<T extends Element = HTMLDivElement>(
  opts: Options = {}
) {
  const { box = "border-box", onChange } = opts;

  const [node, setNode] = useState<T | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  const ref = useCallback((n: T | null) => setNode(n), []);

  useEffect(() => {
    if (!node || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      // Intentamos respetar `box`; si no, caemos a contentRect.
      let width: number;
      let height: number;

      if (
        box === "device-pixel-content-box" &&
        (entry as any).devicePixelContentBoxSize?.[0]
      ) {
        const dp = (entry as any).devicePixelContentBoxSize[0];
        width = dp.inlineSize;
        height = dp.blockSize;
      } else if (box === "content-box" && entry.contentBoxSize?.[0]) {
        const cs = entry.contentBoxSize[0];
        width = cs.inlineSize;
        height = cs.blockSize;
      } else if (entry.borderBoxSize?.[0]) {
        const bs = entry.borderBoxSize[0];
        width = bs.inlineSize;
        height = bs.blockSize;
      } else {
        // Fallback amplio: contentRect
        width = entry.contentRect.width;
        height = entry.contentRect.height;
      }

      const next = { width: Math.round(width), height: Math.round(height) };
      setSize(next);
      onChange?.(next);
    });

    ro.observe(node, { box });

    return () => ro.disconnect();
  }, [node, box, onChange]);

  return { ref, width: size.width, height: size.height };
}
