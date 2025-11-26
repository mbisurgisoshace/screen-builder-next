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
  AnyClipboardPayload,
} from "./CanvasModule/clipboard";
import SelectionGroup from "./CanvasModule/SelectionBox";
import {
  GroupMeta,
  Shape as IShape,
  Position,
  ShapeType,
} from "./CanvasModule/types";
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
import { ScreenShape } from "./CanvasModule/blocks/core/Screen";
import { LayerPanel } from "./LayerPanel";

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

type TreeNode =
  | { type: "group"; id: string; name: string; children: TreeNode[] }
  | { type: "child"; id: string; label: string };

type ClipboardChildrenPayload = {
  kind: "screen-children-v1";
  createdAt: number;
  screenId: string; // the source screen (fallback if you paste outside any screen)
  anchor: { x: number; y: number }; // local (screen) bbox top-left of the copied children
  children: IShape[]; // raw child shapes (as stored inside screen.children)
  groups?: ScreenShape["groups"]; // ONLY the groups that matter for these children (see copySelection)
};

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

  const [examples, setExamples] = useState(true);
  const [solutions, setSolutions] = useState(true);
  const [inspector, setInspector] = useState(false);

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

  // Return all top-level shape ids that share a groupId
  const groupMemberIdsTopLevel = (gid: string) =>
    shapes.filter((s) => !s.parentId && s.groupId === gid).map((s) => s.id);

  // Return all child ids in a screen that share a groupId
  const groupMemberIdsInScreen = (screen: IShape, gid: string) =>
    (screen.children ?? []).filter((c) => c.groupId === gid).map((c) => c.id);

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
        // 2 paths: (A) top-level shapes, (B) screen children
        const topIds = selectedShapeIds.filter((id) => !isChildToken(id));
        const childToks = selectedShapeIds
          .map(parseChildToken)
          .filter(Boolean) as { screenId: string; childId: string }[];

        // (A) Top-level group: need at least 2 top-level items
        if (topIds.length >= 2) {
          e.preventDefault();
          const gid = uuidv4();
          pause();
          try {
            for (const id of topIds) {
              updateShape(id, (s) => ({ ...s, groupId: gid }));
            }
          } finally {
            resume();
          }
          return;
        }

        // (B) Screen-children grouping (can be: only children, only groups, or mix)
        if (childToks.length >= 2) {
          e.preventDefault();
          const screenId = childToks[0].screenId;
          const sameScreen = childToks.every((t) => t.screenId === screenId);
          if (!sameScreen) return;

          const ids = childToks.map((t) => t.childId);

          updateShape(screenId, (s) => {
            const scr = s as ScreenShape;
            const groups = scr.groups ?? [];
            const children = scr.children ?? [];

            // helper: collect ALL descendant childIds of a group (recursively)
            const collectDescendants = (gid: string): string[] => {
              const directChildren = children
                .filter((c) => (c as any).groupId === gid)
                .map((c) => c.id);

              const subGroups = groups
                .filter((g) => (g.parentGroupId ?? null) === gid)
                .map((g) => g.id);

              let acc = [...directChildren];
              for (const sg of subGroups) {
                acc = acc.concat(collectDescendants(sg));
              }
              return acc;
            };

            const selectedSet = new Set(ids);

            // groups fully covered by the selection (all their descendant children selected)
            const fullySelectedGroupIds = groups
              .filter((g) => {
                const desc = collectDescendants(g.id);
                return (
                  desc.length > 0 && desc.every((cid) => selectedSet.has(cid))
                );
              })
              .map((g) => g.id);

            // childIds covered by those fully-selected groups
            const coveredByGroups = new Set<string>();
            for (const gid of fullySelectedGroupIds) {
              for (const cid of collectDescendants(gid))
                coveredByGroups.add(cid);
            }

            // loose children explicitly selected that are NOT already covered by those groups
            const looseChildIds = ids.filter(
              (cid) => !coveredByGroups.has(cid)
            );

            // if nothing meaningful to group (shouldn't happen with >=2, but be safe)
            if (fullySelectedGroupIds.length + looseChildIds.length < 2) {
              return scr;
            }

            // create the new parent group
            const newParentId = uuidv4();
            const newParentGroup = {
              id: newParentId,
              name: `Group ${(groups.length ?? 0) + 1}`,
              parentGroupId: null as string | null,
              childIds: [...looseChildIds], // only loose children go here
            };

            // nest the fully-selected groups under the new parent
            const nextGroups = [
              ...groups.map((g) =>
                fullySelectedGroupIds.includes(g.id)
                  ? { ...g, parentGroupId: newParentId }
                  : g
              ),
              newParentGroup,
            ];

            // for loose children, point them to the new parent via child.groupId
            const nextChildren = children.map((c) =>
              looseChildIds.includes(c.id) ? { ...c, groupId: newParentId } : c
            );

            return { ...scr, groups: nextGroups, children: nextChildren };
          });

          return;
        }
      }

      // ---- UNGROUP (Shift + Cmd/Ctrl + G) ----
      if (meta && e.shiftKey && e.key.toLowerCase() === "g") {
        const topIds = selectedShapeIds.filter((id) => !isChildToken(id));
        const childToks = selectedShapeIds
          .map(parseChildToken)
          .filter(Boolean) as { screenId: string; childId: string }[];

        // (A) top-level: unchanged
        if (topIds.length >= 1) {
          e.preventDefault();
          pause();
          try {
            for (const id of topIds) {
              updateShape(id, (s) => ({ ...s, groupId: undefined }));
            }
          } finally {
            resume();
          }
          return;
        }

        // (B) children: if selection is a group, ungroup that group; else remove groupId from selected children
        if (childToks.length >= 1) {
          e.preventDefault();
          const screenId = childToks[0].screenId;
          const sameScreen = childToks.every((t) => t.screenId === screenId);
          if (!sameScreen) return;

          updateShape(screenId, (s) => {
            const scr = s as ScreenShape;
            // Find if the selection fully matches any group
            const selIds = new Set(childToks.map((t) => t.childId));
            const groups = scr.groups ?? [];
            const fullGroup = groups.find(
              (g) =>
                g.childIds.length > 0 &&
                g.childIds.every((id) => selIds.has(id)) &&
                g.childIds.length === selIds.size
            );

            if (fullGroup) {
              return { ...scr, ...ungroup(scr, fullGroup.id) };
            }

            // Otherwise just clear groupId on selected children
            return {
              ...scr,
              children: (scr.children ?? []).map((c) =>
                selIds.has(c.id) ? { ...c, groupId: undefined } : c
              ),
            };
          });
          return;
        }

        // inside your onKeyDown, in the (B) Screen-children group block:
        if (childToks.length >= 2) {
          e.preventDefault();
          const screenId = childToks[0].screenId;
          const sameScreen = childToks.every((t) => t.screenId === screenId);
          if (!sameScreen) return;

          const ids = childToks.map((t) => t.childId);
          updateShape(screenId, (s) => {
            const scr = s as ScreenShape;

            // ⬇️ new: detect if any selected children are actually groups
            const selectedGroups =
              (scr.groups ?? []).filter((g) =>
                g.childIds.every((id) => ids.includes(id))
              ) ?? [];

            if (selectedGroups.length >= 2) {
              // user selected multiple existing groups → nest them
              const newParentId = uuidv4();
              const groups = [
                ...(scr.groups ?? []),
                {
                  id: newParentId,
                  name: `Group ${(scr.groups?.length ?? 0) + 1}`,
                  parentGroupId: null,
                  childIds: [], // none directly yet
                },
              ].map((g) =>
                selectedGroups.some((sg) => sg.id === g.id)
                  ? { ...g, parentGroupId: newParentId }
                  : g
              );

              return { ...scr, groups };
            }

            // default: group selected child elements
            const { screenPatch } = createGroup(scr, ids, null);
            return { ...scr, ...screenPatch };
          });
          return;
        }
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
        gridColumns: {
          enabled: false,
          count: 4,
          gutter: 16,
          margin: 16,
          snapToColumns: true,
        },
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
        "tabs",
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
        tabs: {
          width: 260,
          height: 40,
          tabs: [
            { id: uuidv4(), label: "Tab 1" },
            { id: uuidv4(), label: "Tab 2" },
            { id: uuidv4(), label: "Tab 3" },
          ],
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

  // async function copySelection() {
  //   if (!selectedShapeIds.length) return;
  //   const sel = shapes.filter((s) => selectedShapeIds.includes(s.id));
  //   if (!sel.length) return;
  //   const box = bbox(sel);
  //   const payload: ClipboardPayload<IShape> = {
  //     kind: "shapes-v1",
  //     createdAt: Date.now(),
  //     anchor: { x: box.left, y: box.top },
  //     shapes: sel,
  //   };
  //   await writeClipboard(payload);
  // }
  async function copySelection() {
    if (!selectedShapeIds.length) return;

    // Partition: top-level vs child-tokens
    const topIds = selectedShapeIds.filter((id) => !isChildToken(id));
    const childToks = selectedShapeIds
      .map(parseChildToken)
      .filter((x): x is { screenId: string; childId: string } => !!x);

    // If we’re copying top-level (your existing behavior)
    if (topIds.length) {
      const sel = shapes.filter((s) => topIds.includes(s.id));
      if (!sel.length) return;
      const box = bbox(sel);
      const payload: AnyClipboardPayload = {
        kind: "shapes-v1",
        createdAt: Date.now(),
        anchor: { x: box.left, y: box.top },
        shapes: sel,
      };
      await writeClipboard(payload);
      return;
    }

    // Otherwise: copying children (must be from a single screen)
    if (!childToks.length) return;
    const screenId = childToks[0].screenId;
    if (!childToks.every((t) => t.screenId === screenId)) {
      // optional: bail or only copy from the first screen
      return;
    }

    const screen = shapes.find((s) => s.id === screenId) as
      | ScreenShape
      | undefined;
    if (!screen) return;

    const ids = childToks.map((t) => t.childId);
    const kids = (screen.children ?? []).filter((c) => ids.includes(c.id));
    if (!kids.length) return;

    const localBox = bboxChildren(kids);
    const groups = collectGroupsForChildren(screen, ids);

    const payload: ClipboardChildrenPayload = {
      kind: "screen-children-v1",
      createdAt: Date.now(),
      screenId,
      anchor: { x: localBox.left, y: localBox.top }, // local anchor
      children: kids,
      groups,
    };

    await writeClipboard(payload);
  }

  // async function cutSelection() {
  //   if (!selectedShapeIds.length) return;
  //   await copySelection();
  //   deleteSelectedShapes();
  // }
  async function cutSelection() {
    if (!selectedShapeIds.length) return;

    // If there are child tokens, handle them specially (then copy)
    const childToks = selectedShapeIds
      .map(parseChildToken)
      .filter((x): x is { screenId: string; childId: string } => !!x);

    if (childToks.length) {
      await copySelection();

      // Delete selected children from their screens; drop empty groups
      pause();
      try {
        const byScreen = new Map<string, string[]>();
        childToks.forEach(({ screenId, childId }) => {
          (
            byScreen.get(screenId) ?? byScreen.set(screenId, []).get(screenId)!
          ).push(childId);
        });

        for (const [screenId, childIds] of byScreen) {
          updateShape(screenId, (s) => {
            const children = (s.children ?? []).filter(
              (c) => !childIds.includes(c.id)
            );
            //@ts-ignore
            let groups = s.groups ?? [];

            // Remove childIds from groups, then drop empty groups
            groups = groups
              //@ts-ignore
              .map((g) => ({
                ...g,
                childIds: (g.childIds ?? []).filter(
                  //@ts-ignore
                  (id) => !childIds.includes(id)
                ),
              }))
              //@ts-ignore
              .filter((g) => (g.childIds?.length ?? 0) > 0);

            return { ...s, children, groups };
          });
        }

        setSelectedShapeIds([]);
      } finally {
        resume();
      }
      return;
    }

    // Fallback: your existing top-level cut
    await copySelection();
    deleteSelectedShapes();
  }

  // async function pasteFromClipboard() {
  //   const data = await readClipboard<ClipboardPayload<IShape>>();
  //   if (!data?.shapes?.length) return;
  //   console.log("data", data);
  //   const anchorTarget = pasteAnchor();
  //   const { left, top, width, height } = bbox(data.shapes);
  //   const dx = anchorTarget.x - (left + width / 2);
  //   const dy = anchorTarget.y - (top + height / 2);
  //   const newIds: string[] = [];
  //   pause();
  //   try {
  //     for (const s of data.shapes) {
  //       const newId = uuidv4();
  //       newIds.push(newId);
  //       addShape(s.type as ShapeType, s.x + dx, s.y + dy, newId);
  //       updateShape(newId, () => ({
  //         ...toTemplate(s),
  //         id: newId,
  //         x: s.x + dx,
  //         y: s.y + dy,
  //       }));
  //     }
  //     setSelectedShapeIds(newIds);
  //   } finally {
  //     resume();
  //   }
  // }

  async function pasteFromClipboard() {
    const data = await readClipboard<any>();
    if (!data) return;

    // === Existing top-level paste ===
    if (data.kind === "shapes-v1") {
      const sel = data.shapes as IShape[];
      if (!sel?.length) return;

      const anchorTarget = pasteAnchor();
      const { left, top, width, height } = bbox(sel);
      const dx = anchorTarget.x - (left + width / 2);
      const dy = anchorTarget.y - (top + height / 2);

      const newIds: string[] = [];
      pause();
      try {
        for (const s of sel) {
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
      return;
    }

    // === New: paste screen children ===
    if (data.kind === "screen-children-v1") {
      const payload = data as ClipboardChildrenPayload;
      const srcKids = payload.children ?? [];
      if (!srcKids.length) return;

      // Where are we pasting? Try pointer; otherwise fallback to source screen
      const worldAnchor = pasteAnchor(); // world coords (canvas space)
      const screensList = shapes.filter(
        (s) => s.type === "screen"
      ) as ScreenShape[];
      const targetScreen =
        screenAtPoint(worldAnchor.x, worldAnchor.y, screensList) ||
        screensList.find((s) => s.id === payload.screenId);
      if (!targetScreen) return;

      // Convert world paste point to target screen local coords (center paste)
      const localPasteX = worldAnchor.x - targetScreen.x;
      const localPasteY = worldAnchor.y - targetScreen.y;

      const srcBox = bboxChildren(srcKids);
      const srcCenterX = srcBox.left + srcBox.width / 2;
      const srcCenterY = srcBox.top + srcBox.height / 2;

      const dx = localPasteX - srcCenterX;
      const dy = localPasteY - srcCenterY;

      // Remap child IDs and group IDs (to keep groups intact)
      const childIdMap = new Map<string, string>();
      srcKids.forEach((c) => childIdMap.set(c.id, uuidv4()));

      // Which groups are included?
      const srcGroups = (payload.groups ?? []) as NonNullable<
        ScreenShape["groups"]
      >;
      const groupIdMap = new Map<string, string>();
      srcGroups.forEach((g) => groupIdMap.set(g.id, uuidv4()));

      // Build new groups with remapped ids, parentGroupId, and childIds
      const newGroups = srcGroups.map((g) => ({
        id: groupIdMap.get(g.id)!,
        name: g.name,
        parentGroupId: g.parentGroupId
          ? groupIdMap.get(g.parentGroupId) ?? null
          : null,
        childIds: (g.childIds ?? [])
          .map((cid) => childIdMap.get(cid)!)
          .filter(Boolean),
      }));

      // Build new children (clamped inside screen)
      const MIN_W = 1,
        MIN_H = 1;
      const newChildren = srcKids.map((c) => {
        const nx = Math.min(
          Math.max(c.x + dx, 0),
          Math.max(0, targetScreen.width - c.width)
        );
        const ny = Math.min(
          Math.max(c.y + dy, 0),
          Math.max(0, targetScreen.height - c.height)
        );
        return {
          ...c,
          id: childIdMap.get(c.id)!,
          x: nx,
          y: ny,
          width: Math.max(MIN_W, c.width),
          height: Math.max(MIN_H, c.height),
          // remap group
          groupId: c.groupId ? groupIdMap.get(c.groupId) : undefined,
        } as IShape;
      });

      // Commit
      pause();
      try {
        updateShape(targetScreen.id, (s) => {
          const children = [...(s.children ?? []), ...newChildren];
          //@ts-ignore
          const groups = [...(s.groups ?? []), ...newGroups];
          return { ...s, children, groups };
        });

        // Select newly pasted children
        const tokens = newChildren.map((c) =>
          childToken(targetScreen.id, c.id)
        );
        setSelectedShapeIds(tokens);
      } finally {
        resume();
      }
      return;
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

  // Find the screen under a world point (x,y)
  function screenAtPoint(
    worldX: number,
    worldY: number,
    screens: ScreenShape[]
  ) {
    for (let i = screens.length - 1; i >= 0; i--) {
      const s = screens[i];
      if (
        worldX >= s.x &&
        worldX <= s.x + s.width &&
        worldY >= s.y &&
        worldY <= s.y + s.height
      )
        return s;
    }
    return null;
  }

  // Compute local bbox (in screen coords) for a set of children
  function bboxChildren(children: IShape[]) {
    const xs = children.map((c) => c.x);
    const ys = children.map((c) => c.y);
    const xe = children.map((c) => c.x + c.width);
    const ye = children.map((c) => c.y + c.height);
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const right = Math.max(...xe);
    const bottom = Math.max(...ye);
    return { left, top, width: right - left, height: bottom - top };
  }

  // Build the minimal group subtree for the selected children
  function collectGroupsForChildren(screen: ScreenShape, childIds: string[]) {
    const usedGroupIds = new Set<string>();
    const byId = new Map((screen.groups ?? []).map((g) => [g.id, g]));
    const byParent = new Map<string | null, string[]>();
    (screen.groups ?? []).forEach((g) => {
      const k = g.parentGroupId ?? null;
      (byParent.get(k) ?? byParent.set(k, []).get(k)!).push(g.id);
    });

    // Mark groups that own any selected children
    const owners = new Set<string>();
    for (const c of screen.children ?? []) {
      const gid = (c as any).groupId as string | undefined;
      if (!gid) continue;
      if (childIds.includes(c.id)) owners.add(gid);
    }

    // For each owner, include it and its ancestor chain
    const includeChain = (gid: string) => {
      let cur: string | undefined | null = gid;
      while (cur) {
        if (usedGroupIds.has(cur)) break;
        usedGroupIds.add(cur);
        const g = byId.get(cur);
        cur = g?.parentGroupId ?? null;
      }
    };
    owners.forEach(includeChain);

    // Return only groups in usedGroupIds, and trim childIds to those included
    const groups = (screen.groups ?? [])
      .filter((g) => usedGroupIds.has(g.id))
      .map((g) => ({
        ...g,
        // Only keep childIds that are actually in the selection
        childIds: (g.childIds ?? []).filter((cid) => childIds.includes(cid)),
      }));

    return groups;
  }

  function selectedChildIdsForScreen(
    screenId: string,
    selectedShapeIds: string[],
    parseChildToken: (t: string) => { screenId: string; childId: string } | null
  ) {
    return selectedShapeIds
      .map(parseChildToken)
      .filter(
        (x): x is { screenId: string; childId: string } =>
          !!x && x.screenId === screenId
      )
      .map((x) => x.childId);
  }

  // Create a new group under a screen (optionally nested in parentGroupId)
  function createGroup(
    screen: ScreenShape,
    childIds: string[],
    parentGroupId?: string | null
  ): { screenPatch: Partial<ScreenShape>; newGroupId: string } {
    const gid = uuidv4();
    const groups = [
      ...(screen.groups ?? []),
      {
        id: gid,
        name: `Group ${(screen.groups?.length ?? 0) + 1}`,
        parentGroupId: parentGroupId ?? null,
        childIds: [...childIds],
      },
    ];

    const children = (screen.children ?? []).map((c) =>
      childIds.includes(c.id) ? { ...c, groupId: gid } : c
    );

    return { screenPatch: { groups, children }, newGroupId: gid };
  }

  // Remove a group: move its children to parentGroupId (or screen root), delete group
  function ungroup(screen: ScreenShape, groupId: string): Partial<ScreenShape> {
    const groups = [...(screen.groups ?? [])];
    const idx = groups.findIndex((g) => g.id === groupId);
    if (idx === -1) return {};

    const parentGroupId = groups[idx].parentGroupId ?? null;
    const childIds = groups[idx].childIds;

    // move children out
    const children = (screen.children ?? []).map((c) =>
      childIds.includes(c.id)
        ? { ...c, groupId: parentGroupId ?? undefined }
        : c
    );

    // delete group
    groups.splice(idx, 1);

    return { groups, children };
  }

  function buildLayerTree(screen: ScreenShape): TreeNode[] {
    const groups = screen.groups ?? [];
    const byParent: Record<string, string[]> = {};
    const groupMap = new Map(groups.map((g) => [g.id, g]));
    for (const g of groups) {
      const parent = g.parentGroupId ?? "__root__";
      if (!byParent[parent]) byParent[parent] = [];
      byParent[parent].push(g.id);
    }

    // children that are at root (no groupId)
    const rootChildIds = (screen.children ?? [])
      .filter((c) => !c.groupId)
      .map((c) => c.id);

    function buildGroupNode(groupId: string): TreeNode {
      const g = groupMap.get(groupId)!;
      // child leaf nodes inside this group
      const childLeaves: TreeNode[] = (screen.children ?? [])
        .filter((c) => c.groupId === groupId)
        .map((c) => ({ type: "child", id: c.id, label: c.label ?? c.type }));

      // nested groups
      const nested = (byParent[groupId] ?? []).map(buildGroupNode);

      return {
        type: "group",
        id: g.id,
        name: g.name ?? "Group",
        children: [...nested, ...childLeaves],
      };
    }

    const rootGroups = (byParent["__root__"] ?? []).map(buildGroupNode);
    const rootChildLeaves: TreeNode[] = rootChildIds.map((id) => {
      const c = (screen.children ?? []).find((x) => x.id === id)!;
      return { type: "child", id, label: c.label ?? c.type };
    });

    // Render groups first then loose children (like Figma)
    return [...rootGroups, ...rootChildLeaves];
  }

  // function selectGroupTokens(
  //   screenId: string,
  //   groupId: string,
  //   additive: boolean
  // ) {
  //   const scr = screens.find((s) => s.id === screenId);
  //   if (!scr) return;
  //   const tokens =
  //     scr.children
  //       ?.filter((c) => c.groupId === groupId)
  //       .map((c) => childToken(screenId, c.id)) ?? [];

  //   setSelectedShapeIds((prev) => {
  //     if (additive) {
  //       // add any missing tokens
  //       const set = new Set(prev);
  //       tokens.forEach((t) => set.add(t));
  //       return Array.from(set);
  //     }
  //     return tokens;
  //   });
  // }

  const selectGroupTokens = (
    screenId: string,
    groupId: string,
    additive: boolean
  ) => {
    const screen = (shapes as IShape[]).find((s) => s.id === screenId);
    if (!screen || screen.type !== "screen") return;

    const groups = (screen as any).groups ?? [];
    const children = (screen as any).children ?? [];

    // Build parent->children index of groups
    const byParent = new Map<string, string[]>();
    for (const g of groups) {
      const pid = (g.parentGroupId ?? "") as string;
      const arr = byParent.get(pid) ?? [];
      arr.push(g.id);
      byParent.set(pid, arr);
    }

    // Collect all descendant groupIds (including root)
    const allGroupIds = new Set<string>();
    const stack = [groupId];
    while (stack.length) {
      const gid = stack.pop()!;
      if (allGroupIds.has(gid)) continue;
      allGroupIds.add(gid);
      (byParent.get(gid) ?? []).forEach((cid) => stack.push(cid));
    }

    // Gather child tokens for any child whose groupId is in allGroupIds
    const toks: string[] = children
      .filter((c: any) => c.groupId && allGroupIds.has(c.groupId as string))
      .map((c: any) => childToken(screenId, c.id));

    setSelectedShapeIds((prev) => {
      if (additive) {
        const allIncluded = toks.every((t) => prev.includes(t));
        if (allIncluded) return prev.filter((t) => !toks.includes(t));
        const set = new Set(prev);
        toks.forEach((t) => set.add(t));
        return Array.from(set);
      }
      return toks;
    });
  };

  const screens = shapes.filter((s) => s.type === "screen") as ScreenShape[];

  const moveChildToGroup = (
    screenId: string,
    childId: string,
    targetGroupId: string | null
  ) => {
    updateShape(screenId, (s) => {
      const kids = (s.children ?? []).map((c) =>
        c.id === childId ? { ...c, groupId: targetGroupId ?? undefined } : c
      );
      return { ...s, children: kids };
    });
  };

  const nestGroup = (
    screenId: string,
    groupId: string,
    parentGroupId: string | null
  ) => {
    updateShape(screenId, (s) => {
      //@ts-ignore
      const groups = (s.groups ?? []).map((g) =>
        g.id === groupId ? { ...g, parentGroupId: parentGroupId ?? null } : g
      );
      return { ...s, groups };
    });
  };

  const createGroupWith = (
    screenId: string,
    childIds: string[],
    parentGroupId: string | null
  ) => {
    const screen = (shapes as any[]).find((sh) => sh.id === screenId) as
      | ScreenShape
      | undefined;
    if (!screen || childIds.length < 2) return;

    // your existing helper does exactly this
    const { screenPatch, newGroupId } = createGroup(
      screen,
      childIds,
      parentGroupId
    );
    updateShape(screenId, (s) => ({ ...s, ...screenPatch }));

    // Select the whole new group
    setSelectedShapeIds(childIds.map((id) => `child:${screenId}:${id}`));
  };

  // Create a new group that contains (A) these childIds and (B) these groupIds,
  // all under parentGroupId (or root if null).
  function wrapIntoGroup(
    screenId: string,
    payload: {
      childIds: string[];
      groupIds: string[];
      parentGroupId: string | null;
    }
  ) {
    const screen = (shapes as ScreenShape[]).find((s) => s.id === screenId);
    if (!screen) return;

    const newId = uuidv4();
    const parentGroupId = payload.parentGroupId ?? null;

    // 1) create the new group meta
    const newGroup: GroupMeta = {
      id: newId,
      name: `Group ${(screen.groups?.length ?? 0) + 1}`,
      parentGroupId,
      childIds: [], // we store children on shapes; this array is optional meta
    };

    updateShape(screenId, (s) => {
      // 2) re-parent the dragged groups under the new group
      //@ts-ignore
      const groups = (s.groups ?? []).map((g) =>
        payload.groupIds.includes(g.id) ? { ...g, parentGroupId: newId } : g
      );

      // 3) move the listed children into the new group
      const children = (s.children ?? []).map((c) =>
        payload.childIds.includes(c.id) ? { ...c, groupId: newId } : c
      );

      return {
        ...s,
        groups: [...groups, newGroup],
        children,
      };
    });
  }

  return (
    <div className="w-full h-full overflow-hidden bg-[#EFF0F4] relative flex">
      <LayerPanel
        screens={screens}
        selectedShapeIds={selectedShapeIds}
        setSelectedShapeIds={setSelectedShapeIds}
        childToken={childToken}
        parseChildToken={parseChildToken}
        // selectGroupTokens={(screenId, groupId, additive) =>
        //   selectGroupTokens(screenId, groupId, additive)
        // }
        selectGroupTokens={selectGroupTokens}
        buildLayerTree={(screen) => buildLayerTree(screen)}
        moveChildToGroup={moveChildToGroup}
        nestGroup={nestGroup}
        createGroupWith={createGroupWith}
        wrapIntoGroup={wrapIntoGroup}
      />

      {/* HUD + helpers omitted for brevity (keep yours) */}

      <div className="absolute bottom-4 right-4 z-20 flex flex-row gap-6 bg-black p-2 rounded-md text-white">
        <div className="flex items-center gap-3 ">
          <Checkbox
            id="inspector"
            checked={inspector}
            onCheckedChange={() => setInspector(!inspector)}
            className={
              "data-[state=checked]:bg-white data-[state=checked]:text-black"
            }
          />
          <Label htmlFor="inspector">Inspector</Label>
        </div>
      </div>

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

      <div className="absolute bottom-4 left-[275px] z-20 flex items-center flex-row gap-2">
        <Button
          variant={"default"}
          size={"icon"}
          className="size-8"
          onClick={zoomIn}
        >
          <ZoomInIcon />
        </Button>
        <Button
          variant={"default"}
          size={"icon"}
          className="size-8"
          onClick={zoomOut}
        >
          <ZoomOutIcon />
        </Button>
      </div>

      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <ActiveUsersBar maxVisible={3} includeSelf={false} />
      </div>

      <LiveCursors
        canvasRef={canvasRef}
        position={position}
        scale={scale}
        includeSelf={false}
        zIndex={550}
      />

      {/* Toolbar */}
      {editable && (
        <div className="absolute top-1/2 -translate-y-1/2 left-[300px] z-20 py-4 px-3 bg-white  rounded-2xl shadow flex flex-col gap-6 items-center">
          {toolbarOptions.rectangle && (
            <button
              draggable
              onDragStart={(e) => {
                console.log("e", e);

                e.dataTransfer.setData("shape-type", "rect");
              }}
              className="w-10 h-10 gap-1 flex flex-col items-center "
              title="Rectangle"
            >
              {/* <SquarePlus className="text-[#111827] pointer-events-none" /> */}
              <NextImage
                src={"/rectangle.svg"}
                alt="Rectangle"
                width={20}
                height={20}
                className="pointer-events-none"
              />
              <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
                Rectangle
              </span>
            </button>
          )}

          {toolbarOptions.ellipse && (
            <button
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("shape-type", "ellipse");
              }}
              className="w-10 h-10 gap-1 flex flex-col items-center "
              title="Ellipse"
            >
              {/* <SquarePlus className="text-[#111827] pointer-events-none" /> */}
              <NextImage
                src={"/ellipse.svg"}
                alt="Ellipse"
                width={20}
                height={20}
                className="pointer-events-none"
              />
              <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
                Ellipse
              </span>
            </button>
          )}

          {/* <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("shape-type", "text");
          }}
          className="w-10 h-10 flex items-center justify-center bg-yellow-300 rounded text-black font-bold"
          title="Text"
        >
          Tx
        </button> */}

          {toolbarOptions.text && (
            <button
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("shape-type", "text");
              }}
              className="w-10 h-10 gap-1 flex flex-col items-center "
              title="Text"
            >
              {/* <SquarePlus className="text-[#111827] pointer-events-none" /> */}
              <NextImage
                src={"/text.svg"}
                alt="Text"
                width={16}
                height={16}
                className="pointer-events-none"
              />
              <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
                Text
              </span>
            </button>
          )}

          {/* <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("shape-type", "interview");
          }}
          className="w-10 h-10 flex items-center justify-center bg-purple-300 rounded text-black font-bold"
          title="Interview"
        >
          In
        </button> */}

          {toolbarOptions.interview && (
            <button
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("shape-type", "interview");
              }}
              className="w-10 h-10  flex flex-col items-center "
              title="Interview"
            >
              <SquarePlus className="text-[#111827] pointer-events-none" />
              <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
                Interview
              </span>
            </button>
          )}

          {/* <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("shape-type", "question");
          }}
          className="w-10 h-10 flex items-center justify-center bg-red-300 rounded text-black font-bold"
          title="Question"
        >
          Qs
        </button> */}

          {toolbarOptions.question && (
            <button
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("shape-type", "question");
              }}
              className="w-10 h-10  flex flex-col items-center "
              title="Question"
            >
              <SquarePlus className="text-[#111827] pointer-events-none" />
              <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
                Question
              </span>
            </button>
          )}

          {/* <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("shape-type", "question_answer");
          }}
          className="w-10 h-10 flex items-center justify-center bg-amber-300 rounded text-black font-bold"
          title="Answer"
        >
          An
        </button> */}

          {toolbarOptions.answer && (
            <button
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("shape-type", "question_answer");
              }}
              className="w-10 h-10  flex flex-col items-center "
              title="Answer"
            >
              <SquarePlus className="text-[#111827] pointer-events-none" />
              <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
                Answer
              </span>
            </button>
          )}

          {/* <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("shape-type", "table");
          }}
          className="w-10 h-10 flex items-center justify-center bg-pink-300 rounded text-black font-bold"
          title="Table"
        >
          Tb
        </button> */}
          {toolbarOptions.table && (
            <button
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("shape-type", "table");
              }}
              className="w-10 h-10  flex flex-col items-center "
              title="Table"
            >
              <SquarePlus className="text-[#111827] pointer-events-none" />
              <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
                Table
              </span>
            </button>
          )}

          {/* <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("shape-type", "feature_idea");
          }}
          className="w-10 h-10 flex items-center justify-center bg-indigo-300 rounded text-black font-bold"
          title="Feature Idea"
        >
          Fi
        </button> */}
          {toolbarOptions.feature && (
            <button
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("shape-type", "feature_idea");
              }}
              className="w-10 h-10  flex flex-col items-center "
              title="Feature Idea"
            >
              <SquarePlus className="text-[#111827] pointer-events-none" />
              <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
                Feature
              </span>
            </button>
          )}

          {toolbarOptions.card && (
            <button
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("shape-type", "card");
              }}
              className="w-10 h-10 gap-1 flex flex-col items-center "
              title="Card"
            >
              {/* <SquarePlus className="text-[#111827] pointer-events-none" /> */}
              <NextImage
                src={"/card.svg"}
                alt="Card"
                width={20}
                height={20}
                className="pointer-events-none"
              />
              <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
                Card
              </span>
            </button>
          )}

          <button
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("shape-type", "screen");
            }}
            className="w-10 h-10 gap-1 flex flex-col items-center "
            title="Screen"
          >
            {/* <SquarePlus className="text-[#111827] pointer-events-none" /> */}
            <NextImage
              src={"/card.svg"}
              alt="Card"
              width={20}
              height={20}
              className="pointer-events-none"
            />
            <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
              Screen
            </span>
          </button>

          <button
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("shape-type", "button");
            }}
            className="w-10 h-10 gap-1 flex flex-col items-center "
            title="Button"
          >
            {/* <SquarePlus className="text-[#111827] pointer-events-none" /> */}
            <NextImage
              src={"/card.svg"}
              alt="Button"
              width={20}
              height={20}
              className="pointer-events-none"
            />
            <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
              Button
            </span>
          </button>

          <button
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("shape-type", "label");
            }}
            className="w-10 h-10 gap-1 flex flex-col items-center "
            title="Label"
          >
            {/* <SquarePlus className="text-[#111827] pointer-events-none" /> */}
            <NextImage
              src={"/card.svg"}
              alt="Label"
              width={20}
              height={20}
              className="pointer-events-none"
            />
            <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
              Label
            </span>
          </button>

          <button
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("shape-type", "input");
            }}
            className="w-10 h-10 gap-1 flex flex-col items-center "
            title="Input"
          >
            {/* <SquarePlus className="text-[#111827] pointer-events-none" /> */}
            <NextImage
              src={"/card.svg"}
              alt="Input"
              width={20}
              height={20}
              className="pointer-events-none"
            />
            <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
              Input
            </span>
          </button>

          <button
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("shape-type", "dropdown");
            }}
            className="w-10 h-10 gap-1 flex flex-col items-center "
            title="Dropdown"
          >
            {/* <SquarePlus className="text-[#111827] pointer-events-none" /> */}
            <NextImage
              src={"/card.svg"}
              alt="Dropdown"
              width={20}
              height={20}
              className="pointer-events-none"
            />
            <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
              Dropdown
            </span>
          </button>

          <button
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("shape-type", "checkbox");
            }}
            className="w-10 h-10 gap-1 flex flex-col items-center "
            title="Checkbox"
          >
            {/* <SquarePlus className="text-[#111827] pointer-events-none" /> */}
            <NextImage
              src={"/card.svg"}
              alt="Checkbox"
              width={20}
              height={20}
              className="pointer-events-none"
            />
            <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
              Checkbox
            </span>
          </button>

          <button
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("shape-type", "toggle");
            }}
            className="w-10 h-10 gap-1 flex flex-col items-center "
            title="Toggle"
          >
            {/* <SquarePlus className="text-[#111827] pointer-events-none" /> */}
            <NextImage
              src={"/card.svg"}
              alt="Toggle"
              width={20}
              height={20}
              className="pointer-events-none"
            />
            <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
              Toggle
            </span>
          </button>

          <button
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("shape-type", "container");
            }}
            className="w-10 h-10 gap-1 flex flex-col items-center "
            title="Container"
          >
            {/* <SquarePlus className="text-[#111827] pointer-events-none" /> */}
            <NextImage
              src={"/card.svg"}
              alt="Container"
              width={20}
              height={20}
              className="pointer-events-none"
            />
            <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
              Container
            </span>
          </button>

          <button
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("shape-type", "tabs");
            }}
            className="w-10 h-10 gap-1 flex flex-col items-center "
            title="Tabs"
          >
            {/* <SquarePlus className="text-[#111827] pointer-events-none" /> */}
            <NextImage
              src={"/card.svg"}
              alt="Tabs"
              width={20}
              height={20}
              className="pointer-events-none"
            />
            <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
              Tabs
            </span>
          </button>
        </div>
      )}

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
                showInspector={inspector}
                //renderHandles={renderHandles}
                onResizeStart={startResizing}
                selectedCount={selectedShapeIds.length}
                isSelected={selectedShapeIds.includes(shape.id)}
                onMouseDown={(e) => {
                  // handleShapeMouseDown(e, shape.id);
                  const additive = e.metaKey || e.ctrlKey;
                  if (!additive && shape.groupId) {
                    // Expand selection to entire top-level group
                    const ids = groupMemberIdsTopLevel(shape.groupId);
                    setSelectedShapeIds(ids);
                    // then delegate to your existing handler so drag/resize keeps working
                    handleShapeMouseDown(e, shape.id);
                  } else {
                    handleShapeMouseDown(e, shape.id);
                  }
                }}
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
                  // e.preventDefault();
                  // e.stopPropagation();

                  // const token = childToken(screenId, childId);
                  // const additive = e.metaKey || e.ctrlKey; // Cmd on mac, Ctrl on Windows

                  // setDragging(false);
                  // setResizing(null);

                  // setSelectedShapeIds((prev) => {
                  //   const already = prev.includes(token);
                  //   const selectedInThisScreen = prev.filter((id) =>
                  //     id.startsWith(`child:${screenId}:`)
                  //   );

                  //   if (additive) {
                  //     // Toggle membership
                  //     return already
                  //       ? prev.filter((id) => id !== token)
                  //       : [...prev, token];
                  //   }

                  //   // No modifier:
                  //   // If multiple from this screen are selected and we clicked one of them,
                  //   // keep the group as-is (don’t collapse to a single).
                  //   if (selectedInThisScreen.length > 1 && already) {
                  //     return prev;
                  //   }

                  //   // Otherwise, focus just this child.
                  //   return [token];
                  // });
                  e.preventDefault();
                  e.stopPropagation();

                  const additive = e.metaKey || e.ctrlKey;
                  const token = `child:${screenId}:${childId}`;

                  setDragging(false);
                  setResizing(null);

                  // Fetch this screen to read child's groupId
                  const screen = shapes.find((s) => s.id === screenId);
                  const child = screen?.children?.find((c) => c.id === childId);
                  const gid = child?.groupId;

                  setSelectedShapeIds((prev) => {
                    if (additive) {
                      // Toggle only the clicked child (preserves your current behavior)
                      return prev.includes(token)
                        ? prev.filter((id) => id !== token)
                        : [...prev, token];
                    }

                    if (gid) {
                      // expand to the full child group within this screen
                      const groupedIds = (screen?.children ?? [])
                        .filter((c) => c.groupId === gid)
                        .map((c) => `child:${screenId}:${c.id}`);
                      return groupedIds.length ? groupedIds : [token];
                    }

                    // No group: single-select this child
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
