"use client";
import { v4 as uuidv4 } from "uuid";
import {
  useUndo,
  useRedo,
  useCanUndo,
  useHistory,
  useCanRedo,
} from "@liveblocks/react";
import { useRef, useState, useEffect, useMemo } from "react";

import {
  writeClipboard,
  readClipboard,
  ClipboardPayload,
} from "./CanvasModule/clipboard";
import SelectionGroup from "./CanvasModule/SelectionBox";
import { Shape as IShape, Position, ShapeType } from "./CanvasModule/types";
import { useSmartGuidesStore } from "./CanvasModule/hooks/useSmartGuidesStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

import { shapeRegistry } from "./CanvasModule/blocks/blockRegistry";
import { useShapeManager } from "./CanvasModule/hooks/useShapeManager";
import { useShapeDragging } from "./CanvasModule/hooks/useShapeDragging";
import { useShapeResizing } from "./CanvasModule/hooks/useShapeResizing";
import { useBorderSnapping } from "./CanvasModule/hooks/useBorderSnapping";
import { useCanvasTransform } from "./CanvasModule/hooks/useCanvasTransform";
import { useMarqueeSelection } from "./CanvasModule/hooks/useMarqueeSelection";
import { useShapeInteraction } from "./CanvasModule/hooks/useShapeInteraction";
import { useCanvasInteraction } from "./CanvasModule/hooks/useCanvasInteraction";
import { useConnectionManager } from "./CanvasModule/hooks/useConnectionManager";
import { SelectableConnectionArrow } from "./CanvasModule/SelectableConnectionArrow";
import { useRealtimeShapes } from "./CanvasModule/hooks/realtime/useRealtimeShapes";
import { useRealtimeConnections } from "./CanvasModule/hooks/realtime/useRealtimeConnections";
import { uploadToSupabase } from "@/lib/uploadToSupabase";
import { Comments } from "./CanvasModule/Comments";
import { Button } from "./ui/button";
import { PlusIcon, SquarePlus, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { ActiveUsersBar } from "./CanvasModule/live/ActiveUsersBar";
import { LiveCursors } from "./CanvasModule/live/LiveCursors";
import NextImage from "next/image";
import { HelperQuestions } from "./CanvasModule/HelperQuestions";
import { HelperValueProp } from "./CanvasModule/HelperValueProp";
import { HelperAnalysis } from "./CanvasModule/HelperAnalysis";

type RelativeAnchor = { x: number; y: number };
type Connection = {
  fromShapeId: string;
  fromAnchor: { x: number; y: number };
  toShapeId: string;
  toAnchor: { x: number; y: number };
};

export function getAbsoluteAnchorPosition(
  shape: IShape,
  anchor: { x: number; y: number }
): Position {
  return {
    x: shape.x + shape.width * anchor.x,
    y: shape.y + shape.height * anchor.y,
  };
}

interface InfiniteCanvasProps {
  editable?: boolean;
  toolbarOptions?: {
    card: boolean;
    text: boolean;
    table: boolean;
    answer: boolean;
    ellipse: boolean;
    feature: boolean;
    question: boolean;
    rectangle: boolean;
    interview: boolean;
  };
}

export default function InfiniteCanvas({
  editable = true,
  toolbarOptions = {
    card: true,
    text: true,
    table: true,
    answer: true,
    ellipse: true,
    feature: true,
    question: true,
    rectangle: true,
    interview: true,
  },
}: InfiniteCanvasProps) {
  const pathname = usePathname();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string[]>([]);
  const { scale, canvasRef, position, setPosition, setScale, zoomIn, zoomOut } =
    useCanvasTransform();

  const isAnalysisCanvas = pathname.includes("/analysis");
  const isQuestionsCanvas = pathname.includes("/questions");
  const isValuePropCanvas = pathname.includes("/value-proposition");

  const [problems, setProblems] = useState(true);
  const [examples, setExamples] = useState(true);
  const [solutions, setSolutions] = useState(true);

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const { pause, resume } = useHistory();

  const [showGrid, setShowGrid] = useState(true);
  const [connecting, setConnecting] = useState<{
    fromShapeId: string;
    fromDirection: "top" | "right" | "bottom" | "left";
    fromPosition: { x: number; y: number };
  } | null>(null);

  const [connectingMousePos, setConnectingMousePos] = useState<Position | null>(
    null
  );
  const guides = useSmartGuidesStore((s) => s.guides);
  const [isDraggingConnector, setIsDraggingConnector] = useState(false);

  const {
    shapes,
    addShape,
    updateShape,
    updateMany,
    removeShapes,
    liveShapesReady,
  } = useRealtimeShapes();

  const {
    setShapes,
    selectedShapeIds,
    setSelectedShapeIds,
    toggleSelection,
    selectOnly,
    clearSelection,
    getSelectedShapes,
    getGroupBounds,
    resizing,
    setResizing,
    dragging,
    setDragging,
  } = useShapeManager(scale, position, shapes);

  const {
    connections,
    finalizeFromSnap,
    useConnectionEndpoints,
    selectConnection,
    selectedConnectionId,
    removeSelectedConnection,
    removeConnectionsByIds,
    removeConnection,
    updateConnection,
    addConnectionRelative,
  } = useConnectionManager();

  const connectionEndpoints = useConnectionEndpoints(shapes);

  const { snapResult } = useBorderSnapping(
    connectingMousePos,
    shapes,
    scale,
    connecting?.fromShapeId ?? null
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!editable) return;
      if (connecting) {
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = (e.clientX - rect.left - position.x) / scale;
        const y = (e.clientY - rect.top - position.y) / scale;
        setConnectingMousePos({ x, y });
        if (!isDraggingConnector) setIsDraggingConnector(true);
      }
    };
    const handleMouseUp = () => {
      if (!editable) return;
      if (isDraggingConnector && connecting && snapResult?.shapeId) {
        const fromShape = shapes.find((s) => s.id === connecting.fromShapeId);
        const toShape = shapes.find((s) => s.id === snapResult.shapeId);
        if (!fromShape || !toShape) {
          setConnecting(null);
          setConnectingMousePos(null);
          setIsDraggingConnector(false);
          return;
        }
        finalizeFromSnap({ connecting, snapResult, shapes });
        setConnecting(null);
        setConnectingMousePos(null);
        setIsDraggingConnector(false);
      }
    };
    if (connecting) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    connecting,
    position,
    scale,
    isDraggingConnector,
    snapResult,
    editable,
    shapes,
  ]);

  // ---------- CHILD SELECTION HELPERS (token-based) ----------
  const childToken = (screenId: string, childId: string) =>
    `child:${screenId}:${childId}`;
  const parseChildToken = (tok: string) => {
    // returns {screenId, childId} | null
    if (!tok.startsWith("child:")) return null;
    const parts = tok.split(":");
    if (parts.length !== 3) return null;
    return { screenId: parts[1], childId: parts[2] };
  };

  const selectChildOnly = (screenId: string, childId: string) => {
    setSelectedShapeIds([childToken(screenId, childId)]);
  };

  const toggleChildInSelection = (screenId: string, childId: string) => {
    const tok = childToken(screenId, childId);
    setSelectedShapeIds((prev) =>
      prev.includes(tok) ? prev.filter((t) => t !== tok) : [...prev, tok]
    );
  };

  const isChildSelected = (screenId: string, childId: string) =>
    selectedShapeIds.includes(childToken(screenId, childId));

  // Gather selected children for a given screen (ids only)
  const selectedChildIdsFor = (screenId: string) =>
    selectedShapeIds
      .map(parseChildToken)
      .filter(
        (x): x is { screenId: string; childId: string } =>
          !!x && x.screenId === screenId
      )
      .map((x) => x.childId);

  // ---------- KEYBOARD ----------
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!editable) return;
      if (isTypingIntoField(e.target)) return;

      // toggle grid (plain g)
      if (
        !isTypingIntoField(e.target) &&
        (e.key === "g" || e.key === "G") &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        e.preventDefault();
        setShowGrid((s) => !s);
        return;
      }

      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (meta && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copySelection();
        return;
      }
      if (meta && e.key.toLowerCase() === "x") {
        e.preventDefault();
        cutSelection();
        return;
      }
      if (meta && e.key.toLowerCase() === "v") {
        e.preventDefault();
        pasteFromClipboard();
        return;
      }
      if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelection();
        return;
      }

      // ---- GROUP (Cmd/Ctrl + G) ----
      if (meta && !e.shiftKey && e.key.toLowerCase() === "g") {
        // Only consider child tokens, and only for one screen at a time
        const childToks = selectedShapeIds
          .map(parseChildToken)
          .filter(Boolean) as {
          screenId: string;
          childId: string;
        }[];

        if (childToks.length >= 2) {
          e.preventDefault();
          const screenId = childToks[0].screenId;
          // enforce same screen
          const sameScreen = childToks.every((t) => t.screenId === screenId);
          if (!sameScreen) return;

          const ids = childToks.map((t) => t.childId);
          const gid = uuidv4();

          updateShape(screenId, (s) => {
            const kids = (s.children ?? []).map((c) =>
              ids.includes(c.id) ? { ...c, groupId: gid } : c
            );
            return { ...s, children: kids };
          });
        }
        return;
      }

      // ---- UNGROUP (Shift + Cmd/Ctrl + G) ----
      if (meta && e.shiftKey && e.key.toLowerCase() === "g") {
        const childToks = selectedShapeIds
          .map(parseChildToken)
          .filter(Boolean) as {
          screenId: string;
          childId: string;
        }[];
        if (childToks.length >= 1) {
          e.preventDefault();
          const screenId = childToks[0].screenId;
          const sameScreen = childToks.every((t) => t.screenId === screenId);
          if (!sameScreen) return;

          const ids = childToks.map((t) => t.childId);
          updateShape(screenId, (s) => {
            const kids = (s.children ?? []).map((c) =>
              ids.includes(c.id) ? { ...c, groupId: undefined } : c
            );
            return { ...s, children: kids };
          });
        }
        return;
      }

      // Delete
      const isDelete = e.key === "Backspace" || e.key === "Delete";
      if (isDelete) {
        if (selectedConnectionId) {
          e.preventDefault();
          removeSelectedConnection();
          return;
        }
        if (selectedShapeIds.length > 0) {
          e.preventDefault();
          const exampleShapeIds = shapes
            .filter(
              (shape) =>
                shape.type.includes("example") ||
                shape.subtype?.includes("example")
            )
            .map((s) => s.id);
          setShowDeleteConfirm(
            selectedShapeIds.filter((id) => !exampleShapeIds.includes(id))
          );
          return;
        }
      }

      if (e.key === "Escape" && selectedConnectionId) {
        selectConnection(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    editable,
    selectedShapeIds,
    selectedConnectionId,
    removeSelectedConnection,
    selectConnection,
    undo,
    redo,
    shapes,
    updateShape,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editable) return;
      if (e.key === "Escape") {
        setConnecting(null);
        setConnectingMousePos(null);
        setIsDraggingConnector(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editable]);

  // Panning & marquee selection
  const [isPanning, setIsPanning] = useState(false);
  const [canvasMousePos, setCanvasMousePos] = useState<Position>({
    x: 0,
    y: 0,
  });

  const {
    marquee,
    startMarquee,
    setLastMousePos: setMarqueeMousePos,
  } = useMarqueeSelection({
    scale,
    position,
    canvasRef,
    shapes,
    setSelectedShapeIds,
  });
  const startMarqueeSafe = editable ? startMarquee : () => {};

  useShapeDragging({
    selectedShapeIds,
    setShapes,
    scale,
    updateMany,
    setLastMousePos: setCanvasMousePos,
    lastMousePos: canvasMousePos,
    shapes,
    dragging,
    setDragging,
  });

  useShapeResizing({
    resizing,
    setResizing,
    shapes,
    setShapes,
    updateShape,
    scale,
    lastMousePos: canvasMousePos,
    setLastMousePos: setCanvasMousePos,
  });

  useCanvasInteraction({
    canvasRef,
    setPosition,
    canvasMousePos,
    setCanvasMousePos,
    scale,
    setIsPanning,
    setResizing,
    setDragging,
    startMarquee: startMarqueeSafe,
    setMarqueeMousePos,
  });

  const { handleShapeMouseDown, startResizing } = useShapeInteraction({
    toggleSelection,
    selectOnly,
    setDragging,
    setCanvasMousePos,
    setResizing,
  });

  const nextIdRef = useRef(1000);

  const handleConnectorMouseDown = (
    e: React.MouseEvent,
    shapeId: string,
    direction: "top" | "right" | "bottom" | "left"
  ) => {
    e.preventDefault();
    if (!editable) return;
    const shape = shapes.find((s) => s.id === shapeId);
    if (!shape) return;

    const shapeCenter = {
      x: shape.x + shape.width / 2,
      y: shape.y + shape.height / 2,
    };
    let fromX = shapeCenter.x,
      fromY = shapeCenter.y;
    switch (direction) {
      case "top":
        fromY = shape.y;
        break;
      case "bottom":
        fromY = shape.y + shape.height;
        break;
      case "left":
        fromX = shape.x;
        break;
      case "right":
        fromX = shape.x + shape.width;
        break;
    }
    setConnecting({
      fromShapeId: shapeId,
      fromDirection: direction,
      fromPosition: { x: fromX, y: fromY },
    });
    setDragging(false);
    setResizing(null);
  };

  const groupBounds = getGroupBounds();

  // helpers...
  function getImageSize(src: string): Promise<{ w: number; h: number }> {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = rej;
      img.src = src;
    });
  }

  function bbox(of: IShape[]) {
    const xs = of.map((s) => s.x);
    const ys = of.map((s) => s.y);
    const xe = of.map((s) => s.x + s.width);
    const ye = of.map((s) => s.y + s.height);
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const right = Math.max(...xe);
    const bottom = Math.max(...ye);
    return { left, top, width: right - left, height: bottom - top };
  }

  function toTemplate(s: IShape) {
    const { id, ...rest } = s as any;
    return rest as Omit<IShape, "id">;
  }

  function pasteAnchor() {
    if (canvasMousePos) return { x: canvasMousePos.x, y: canvasMousePos.y };
    const vw = canvasRef.current?.clientWidth ?? 0;
    const vh = canvasRef.current?.clientHeight ?? 0;
    return {
      x: (-position.x + vw / 2) / scale,
      y: (-position.y + vh / 2) / scale,
    };
  }

  // --- DROP HANDLER (unchanged except for your child types) ---
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editable || !canvasRef.current) return;
    const type = e.dataTransfer.getData("shape-type") as ShapeType;

    const { x, y } = clientToWorld(e, canvasRef.current, position, scale);
    const dt = e.dataTransfer;

    // (omitted: your image/file/url code; keep as-is)

    if (!type) return;

    if (type === "screen") {
      const id = uuidv4();
      const w = 1440,
        h = 900;
      addShape("screen", x - w / 2, y - h / 2, id);
      updateShape(id, (s) => ({
        ...s,
        width: w,
        height: h,
        color: "#ffffff",
        screenPreset: "Desktop",
        platform: "web",
        children: [],
      }));
      return;
    }

    // helper to find parent screen at world point
    const parent = (() => {
      const screens = (shapes as IShape[]).filter((s) => s.type === "screen");
      for (let i = screens.length - 1; i >= 0; i--) {
        const s = screens[i];
        const inside =
          x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height;
        if (inside) return s;
      }
      return undefined;
    })();

    // CHILD TYPES (button/label/input/dropdown/checkbox/toggle/container)
    if (
      [
        "button",
        "label",
        "input",
        "dropdown",
        "checkbox",
        "toggle",
        "container",
      ].includes(type) &&
      parent
    ) {
      const id = uuidv4();
      const defaults: Record<string, Partial<IShape>> = {
        button: { width: 120, height: 40, color: "#ffffff", label: "Button" },
        label: {
          width: 120,
          height: 40,
          color: "#ffffff",
          textColor: "#111827",
          textSize: 14,
          text: "Label",
        },
        input: {
          width: 160,
          height: 40,
          color: "#ffffff",
          textColor: "#111827",
          textSize: 14,
          placeholder: "Input",
        },
        dropdown: {
          width: 160,
          height: 40,
          color: "#ffffff",
          textColor: "#111827",
          textSize: 14,
          label: "Select…",
        },
        checkbox: {
          width: 140,
          height: 32,
          textColor: "#111827",
          textSize: 14,
          label: "Checkbox",
          checked: true,
          color: "#3B82F6",
        },
        toggle: {
          width: 120,
          height: 40,
          color: "#ffffff",
          label: "Detailed",
          toggleOn: true,
          textColor: "#0f172a",
          accentColor: "#1F2A44",
        },
        container: { width: 300, height: 75, color: "#ffffff" },
      };
      const w = (defaults[type].width as number) ?? 120;
      const h = (defaults[type].height as number) ?? 40;

      let lx = x - parent.x - w / 2;
      let ly = y - parent.y - h / 2;
      lx = Math.min(Math.max(lx, 0), Math.max(0, parent.width - w));
      ly = Math.min(Math.max(ly, 0), Math.max(0, parent.height - h));

      const child: IShape = {
        id,
        type: type as any,
        x: lx,
        y: ly,
        width: w,
        height: h,
        parentId: parent.id,
        ...defaults[type],
      } as IShape;

      updateShape(parent.id, (ps) => ({
        ...ps,
        children: [...(ps.children ?? []), child],
      }));
      return;
    }

    // normal top-level shapes
    addShape(type, x, y, uuidv4());
  };

  async function makeBase64Thumb(file: File, max = 384): Promise<string> {
    const img = document.createElement("img");
    const blobUrl = URL.createObjectURL(file);
    await new Promise((res, rej) => {
      img.onload = () => res(null);
      img.onerror = rej;
      img.src = blobUrl;
    });
    const ratio = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * ratio));
    const h = Math.max(1, Math.round(img.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(blobUrl);
    return canvas.toDataURL("image/jpeg", 0.7);
  }

  async function uploadToStorage(
    file: File,
    onProgress: (p: number) => void
  ): Promise<{ url: string }> {
    const resp = await fetch(
      `/api/upload-url?filename=${encodeURIComponent(file.name)}`
    );
    if (!resp.ok) throw new Error("Failed to get upload URL");
    const { uploadUrl, fileUrl } = await resp.json();
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) onProgress(evt.loaded / evt.total);
      };
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error("Upload failed"));
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.setRequestHeader(
        "Content-Type",
        file.type || "application/octet-stream"
      );
      xhr.send(file);
    });
    return { url: fileUrl };
  }

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDragStart = (e: React.DragEvent) => e.preventDefault();

  function clientToWorld(
    e: React.DragEvent | React.MouseEvent,
    canvasEl: HTMLDivElement,
    position: { x: number; y: number },
    scale: number
  ) {
    const rect = canvasEl.getBoundingClientRect();
    const x = (e.clientX - rect.left - position.x) / scale;
    const y = (e.clientY - rect.top - position.y) / scale;
    return { x, y };
  }

  function isTypingIntoField(target: EventTarget | null) {
    const el = target as HTMLElement | null;
    if (!el) return false;
    return !!el.closest('input, textarea, [contenteditable="true"]');
  }

  const deleteSelectedShapes = () => {
    if (showDeleteConfirm.length === 0) return;
    const ids = showDeleteConfirm;
    removeConnectionsByIds(ids);
    removeShapes(ids);
    clearSelection?.();
    setConnecting?.(null);
    setConnectingMousePos?.(null);
    setIsDraggingConnector?.(false);
  };

  async function copySelection() {
    if (!selectedShapeIds.length) return;
    const sel = shapes.filter((s) => selectedShapeIds.includes(s.id));
    if (!sel.length) return;
    const box = bbox(sel);
    const payload: ClipboardPayload<IShape> = {
      kind: "shapes-v1",
      createdAt: Date.now(),
      anchor: { x: box.left, y: box.top },
      shapes: sel,
    };
    await writeClipboard(payload);
  }

  async function cutSelection() {
    if (!selectedShapeIds.length) return;
    await copySelection();
    deleteSelectedShapes();
  }

  async function pasteFromClipboard() {
    const data = await readClipboard<ClipboardPayload<IShape>>();
    if (!data?.shapes?.length) return;
    const anchorTarget = pasteAnchor();
    const { left, top, width, height } = bbox(data.shapes);
    const dx = anchorTarget.x - (left + width / 2);
    const dy = anchorTarget.y - (top + height / 2);
    const newIds: string[] = [];
    pause();
    try {
      for (const s of data.shapes) {
        const newId = uuidv4();
        newIds.push(newId);
        addShape(s.type as ShapeType, s.x + dx, s.y + dy, newId);
        updateShape(newId, () => ({
          ...toTemplate(s),
          id: newId,
          x: s.x + dx,
          y: s.y + dy,
        }));
      }
      setSelectedShapeIds(newIds);
    } finally {
      resume();
    }
  }

  async function duplicateSelection() {
    if (!selectedShapeIds.length) return;
    const sel = shapes.filter((s) => selectedShapeIds.includes(s.id));
    if (!sel.length) return;
    const ox = 24,
      oy = 24;
    const newIds: string[] = [];
    pause();
    try {
      for (const s of sel) {
        const newId = uuidv4();
        newIds.push(newId);
        addShape(s.type as ShapeType, s.x + ox, s.y + oy, newId);
        updateShape(newId, () => ({
          ...toTemplate(s),
          id: newId,
          x: s.x + ox,
          y: s.y + oy,
        }));
      }
      setSelectedShapeIds(newIds);
    } finally {
      resume();
    }
  }

  const GRID = 24;
  const MAJOR = GRID * 5;
  function getGridStyle(): React.CSSProperties | undefined {
    if (!showGrid) return undefined;
    const minorPx = Math.max(8, Math.round(GRID * scale));
    const majorPx = Math.max(minorPx * 5, Math.round(MAJOR * scale));
    const offset = `${Math.round(position.x)}px ${Math.round(position.y)}px`;
    return {
      backgroundImage: `
      linear-gradient(to right, rgba(17,24,39,0.06) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(17,24,39,0.06) 1px, transparent 1px),
      linear-gradient(to right, rgba(17,24,39,0.10) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(17,24,39,0.10) 1px, transparent 1px)
    `,
      backgroundSize: `
      ${minorPx}px ${minorPx}px,
      ${minorPx}px ${minorPx}px,
      ${majorPx}px ${majorPx}px,
      ${majorPx}px ${majorPx}px
    `,
      backgroundPosition: `${offset}, ${offset}, ${offset}, ${offset}`,
    };
  }

  const topLevel = shapes.filter((s) => !s.parentId);
  const worldRef = useRef<HTMLDivElement>(null);

  // token helpers
  const isChildToken = (id: string) => id.startsWith("child:");

  console.log("selectedShapes", selectedShapeIds);

  return (
    <div className="w-full h-full overflow-hidden bg-[#EFF0F4] relative flex">
      {/* HUD + helpers omitted for brevity (keep yours) */}

      <AlertDialog
        open={showDeleteConfirm.length > 0}
        onOpenChange={() => setShowDeleteConfirm([])}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              shape.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteSelectedShapes();
                setShowDeleteConfirm([]);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
      >
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={getGridStyle()}
          />
        )}

        <div
          ref={worldRef}
          className="absolute top-0 left-0 w-full h-full"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          {/* marquee, group bounds, connectors, arrows — keep your existing UI here */}

          {topLevel.map((shape) => {
            const Component = shapeRegistry[shape.type];
            if (!Component) return null;
            const selectedChildIds =
              shape.type === "screen" ? selectedChildIdsFor(shape.id) : [];

            return (
              <Component
                key={shape.id}
                shape={shape}
                interactive={editable}
                scale={scale}
                //canvasEl={canvasRef.current}
                canvasEl={worldRef.current}
                position={position}
                //renderHandles={renderHandles}
                onResizeStart={startResizing}
                selectedCount={selectedShapeIds.length}
                isSelected={selectedShapeIds.includes(shape.id)}
                onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
                onConnectorMouseDown={handleConnectorMouseDown}
                //@ts-ignore
                onCommitText={(id, text) =>
                  updateShape(id, (s) => ({
                    ...s,
                    // keep empty strings if user clears the text; Liveblocks adapter already null-coalesces
                    text,
                  }))
                }
                //@ts-ignore
                onCommitInterview={(id, patch) =>
                  updateShape(id, (s) => ({ ...s, ...patch }))
                }
                //@ts-ignore
                onCommitTable={(id, patch) =>
                  updateShape(id, (s) => ({ ...s, ...patch }))
                }
                //@ts-ignore
                onChangeTags={(id, names) => {
                  updateShape(id, (s) => ({ ...s, tags: names }));
                }}
                //@ts-ignore
                onCommitStyle={(id, patch) => {
                  updateShape(id, (s) => ({ ...s, ...patch })); // your existing immutable updater
                }}
                onChildMouseDown={(
                  e: React.PointerEvent,
                  screenId: string,
                  childId: string
                ) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const token = childToken(screenId, childId);
                  const additive = e.metaKey || e.ctrlKey; // Cmd on mac, Ctrl on Windows

                  setDragging(false);
                  setResizing(null);

                  setSelectedShapeIds((prev) => {
                    const already = prev.includes(token);
                    const selectedInThisScreen = prev.filter((id) =>
                      id.startsWith(`child:${screenId}:`)
                    );

                    if (additive) {
                      // Toggle membership
                      return already
                        ? prev.filter((id) => id !== token)
                        : [...prev, token];
                    }

                    // No modifier:
                    // If multiple from this screen are selected and we clicked one of them,
                    // keep the group as-is (don’t collapse to a single).
                    if (selectedInThisScreen.length > 1 && already) {
                      return prev;
                    }

                    // Otherwise, focus just this child.
                    return [token];
                  });
                }}
                isChildSelected={(screenId: string, childId: string) =>
                  isChildSelected(screenId, childId)
                }
              />
            );
          })}

          {/* smart guides render — keep your existing */}
          {guides.map((g, i) =>
            g.type === "v" ? (
              <div
                key={`vg-${i}`}
                className="absolute pointer-events-none"
                style={{
                  left: `${g.x}px`,
                  top: `${Math.min(g.fromY, g.toY)}px`,
                  width: "0px",
                  height: `${Math.abs(g.toY - g.fromY)}px`,
                  borderLeft: "1px dashed #60A5FA",
                  zIndex: 250,
                }}
              />
            ) : (
              <div
                key={`hg-${i}`}
                className="absolute pointer-events-none"
                style={{
                  top: `${g.y}px`,
                  left: `${Math.min(g.fromX, g.toX)}px`,
                  height: "0px",
                  width: `${Math.abs(g.toX - g.fromX)}px`,
                  borderTop: "1px dashed #60A5FA",
                  zIndex: 250,
                }}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

interface CurvedArrowProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color?: string;
  strokeWidth?: number;
  zIndex?: number;
}

export const CurvedArrow: React.FC<CurvedArrowProps> = ({
  from,
  to,
  color = "#3B82F6",
  strokeWidth = 2,
  zIndex = 30,
}) => {
  const pad = 40;
  const minX = Math.min(from.x, to.x) - pad;
  const minY = Math.min(from.y, to.y) - pad;
  const maxX = Math.max(from.x, to.x) + pad;
  const maxY = Math.max(from.y, to.y) + pad;
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const fx = from.x - minX,
    fy = from.y - minY,
    tx = to.x - minX,
    ty = to.y - minY;
  const dx = tx - fx,
    dy = ty - fy,
    curveFactor = 0.3;
  const cp1 = { x: fx + dx * curveFactor, y: fy };
  const cp2 = { x: tx - dx * curveFactor, y: ty };
  const d = `M ${fx},${fy} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${tx},${ty}`;
  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        left: `${minX}px`,
        top: `${minY}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex,
      }}
    >
      <defs>
        <marker
          id="arrowhead-preview"
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={color} />
        </marker>
      </defs>
      <path
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        markerEnd="url(#arrowhead-preview)"
      />
    </svg>
  );
};
