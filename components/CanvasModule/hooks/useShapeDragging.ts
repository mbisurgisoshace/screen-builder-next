import { useEffect } from "react";
import { useHistory } from "@liveblocks/react";

import { Position, Shape } from "../types";
import { useSmartGuidesStore } from "../hooks/useSmartGuidesStore";

interface UseShapeDraggingParams {
  scale: number;
  selectedShapeIds: string[];
  shapes: Shape[];
  setShapes: (shapes: Shape[] | ((prev: Shape[]) => Shape[])) => void;
  setDragging: (dragging: boolean) => void;
  dragging: boolean;
  updateMany: (ids: string[], updater: (s: Shape) => Shape) => void;
  lastMousePos: Position;
  setLastMousePos: (pos: Position) => void;
}

function boundsOf(shapes: Shape[]) {
  const minX = Math.min(...shapes.map((s) => s.x));
  const minY = Math.min(...shapes.map((s) => s.y));
  const maxX = Math.max(...shapes.map((s) => s.x + s.width));
  const maxY = Math.max(...shapes.map((s) => s.y + s.height));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return { left: minX, top: minY, right: maxX, bottom: maxY, cx, cy };
}

export function useShapeDragging({
  scale,
  updateMany,
  selectedShapeIds,
  shapes,
  setShapes,
  setDragging,
  dragging,
  lastMousePos,
  setLastMousePos,
}: UseShapeDraggingParams) {
  const { pause, resume } = useHistory();
  const { setGuides, clear } = useSmartGuidesStore();

  useEffect(() => {
    let didPause = false;
    if (dragging) {
      pause();
      didPause = true;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (dragging && selectedShapeIds.length > 0) {
        const worldDX = (e.clientX - lastMousePos.x) / scale;
        const worldDY = (e.clientY - lastMousePos.y) / scale;

        // --- SMART GUIDES & SNAPPING ---
        const sel = shapes.filter((s) => selectedShapeIds.includes(s.id));
        const others = shapes.filter((s) => !selectedShapeIds.includes(s.id));
        const selB = boundsOf(sel);

        // Proposed new bounds
        const prop = {
          left: selB.left + worldDX,
          right: selB.right + worldDX,
          top: selB.top + worldDY,
          bottom: selB.bottom + worldDY,
          cx: selB.cx + worldDX,
          cy: selB.cy + worldDY,
        };

        // Build candidate lines from others
        type VLine = { x: number; top: number; bottom: number };
        type HLine = { y: number; left: number; right: number };
        const vLines: VLine[] = [];
        const hLines: HLine[] = [];
        for (const o of others) {
          const l = o.x;
          const r = o.x + o.width;
          const t = o.y;
          const b = o.y + o.height;
          const cx = (l + r) / 2;
          const cy = (t + b) / 2;
          vLines.push({ x: l, top: t, bottom: b });
          vLines.push({ x: cx, top: t, bottom: b });
          vLines.push({ x: r, top: t, bottom: b });
          hLines.push({ y: t, left: l, right: r });
          hLines.push({ y: cy, left: l, right: r });
          hLines.push({ y: b, left: l, right: r });
        }

        // Screen-constant tolerance (px) -> world units
        const tol = 6 / scale;

        let snapDX = 0;
        let snapDY = 0;
        const guides: ReturnType<typeof setGuides> extends infer _T
          ? any[]
          : any[] = [];

        // Disable snapping while holding Shift
        const snappingEnabled = !e.shiftKey;

        // X alignment: left/center/right vs other vertical lines
        const candidatesX = [
          { val: prop.left, key: "left" as const },
          { val: prop.cx, key: "cx" as const },
          { val: prop.right, key: "right" as const },
        ];
        let bestX: {
          delta: number;
          line: VLine;
          which: "left" | "cx" | "right";
        } | null = null;
        for (const c of candidatesX) {
          for (const ln of vLines) {
            const d = ln.x - c.val;
            if (Math.abs(d) <= tol) {
              if (!bestX || Math.abs(d) < Math.abs(bestX.delta)) {
                bestX = { delta: d, line: ln, which: c.key };
              }
            }
          }
        }
        if (snappingEnabled && bestX) {
          snapDX = bestX.delta;
          const fromY = Math.min(bestX.line.top, prop.top);
          const toY = Math.max(bestX.line.bottom, prop.bottom);
          guides.push({ type: "v", x: bestX.line.x, fromY, toY });
        }

        // Y alignment: top/center/bottom vs other horizontal lines
        const candidatesY = [
          { val: prop.top, key: "top" as const },
          { val: prop.cy, key: "cy" as const },
          { val: prop.bottom, key: "bottom" as const },
        ];
        let bestY: {
          delta: number;
          line: HLine;
          which: "top" | "cy" | "bottom";
        } | null = null;
        for (const c of candidatesY) {
          for (const ln of hLines) {
            const d = ln.y - c.val;
            if (Math.abs(d) <= tol) {
              if (!bestY || Math.abs(d) < Math.abs(bestY.delta)) {
                bestY = { delta: d, line: ln, which: c.key };
              }
            }
          }
        }
        if (snappingEnabled && bestY) {
          snapDY = bestY.delta;
          const fromX = Math.min(bestY.line.left, prop.left);
          const toX = Math.max(bestY.line.right, prop.right);
          guides.push({ type: "h", y: bestY.line.y, fromX, toX });
        }

        // Publish guides (or clear when none)
        if (guides.length) setGuides(guides);
        else clear();

        updateMany(selectedShapeIds, (s) => ({
          ...s,
          x: s.x + worldDX,
          y: s.y + worldDY,
        }));
        setLastMousePos({ x: e.clientX, y: e.clientY });
      }
    };

    const endDrag = () => {
      if (!dragging) return;
      setDragging(false);
      clear(); // <--- ensure guides are gone
    };

    const endOnHidden = () => {
      if (document.hidden) endDrag();
    };

    const handleMouseUp = () => {
      if (dragging) {
        setDragging(false);

        if (didPause) {
          resume();
          didPause = false;
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("pointerup", endDrag);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseup", endDrag);
      window.removeEventListener("pointerup", endDrag);
    };
  }, [
    dragging,
    selectedShapeIds,
    lastMousePos,
    scale,
    setShapes,
    setDragging,
    setLastMousePos,
  ]);
}
