import React, { useRef, useState } from "react";
import { ScreenShape } from "./CanvasModule/blocks/core/Screen";
import { GroupMeta, Shape } from "./CanvasModule/types";

type TreeNode =
  | { type: "group"; id: string; name: string; children: TreeNode[] }
  | { type: "child"; id: string; label: string; icon?: string };

type LayerPanelProps = {
  screens: ScreenShape[]; // top-level shapes filtered by type === 'screen'
  selectedShapeIds: string[]; // your token array
  childToken: (screenId: string, childId: string) => string;
  parseChildToken: (t: string) => { screenId: string; childId: string } | null;
  setSelectedShapeIds: React.Dispatch<React.SetStateAction<string[]>>;
  // Optional hooks from parent (used if provided)
  selectGroupTokens?: (
    screenId: string,
    groupId: string,
    additive: boolean
  ) => void;
  buildLayerTree?: (screen: ScreenShape) => TreeNode[];

  moveChildToGroup: (
    screenId: string,
    childId: string,
    targetGroupId: string | null
  ) => void;
  nestGroup: (
    screenId: string,
    groupId: string,
    parentGroupId: string | null
  ) => void;
  createGroupWith: (
    screenId: string,
    childIds: string[],
    parentGroupId: string | null
  ) => void;
  wrapIntoGroup: (
    screenId: string,
    payload: {
      childIds: string[];
      groupIds: string[];
      parentGroupId: string | null;
    }
  ) => void;
};

export const LayerPanel: React.FC<LayerPanelProps> = ({
  screens,
  selectedShapeIds,
  childToken,
  parseChildToken,
  setSelectedShapeIds,
  selectGroupTokens,
  buildLayerTree,
  moveChildToGroup,
  nestGroup,
  createGroupWith,
  wrapIntoGroup,
}) => {
  // ---------- NEW: lightweight drag state for visuals ----------
  const [dragging, setDragging] = useState<
    | { kind: "child"; screenId: string; id: string }
    | { kind: "group"; screenId: string; id: string }
    | null
  >(null);
  const [hoverTarget, setHoverTarget] = useState<
    | { kind: "child"; screenId: string; id: string }
    | { kind: "group"; screenId: string; id: string }
    | { kind: "root"; screenId: string }
    | null
  >(null);

  // Reusable drag image (tiny dot) so something shows under the cursor
  const dragImgRef = useRef<HTMLCanvasElement | null>(null);
  const getDragImage = () => {
    if (!dragImgRef.current) {
      const c = document.createElement("canvas");
      c.width = 12;
      c.height = 12;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(6, 6, 5, 0, Math.PI * 2);
      ctx.fill();
      dragImgRef.current = c;
    }
    return dragImgRef.current!;
  };

  function buildScreenTree(screen: ScreenShape): TreeNode[] {
    const groupsById = new Map((screen.groups ?? []).map((g) => [g.id, g]));
    const children = screen.children ?? [];

    // children by group
    const kidsByGroup = new Map<string | null, Shape[]>();
    for (const c of children) {
      const gid = (c as any).groupId ?? null;
      const arr = kidsByGroup.get(gid) ?? [];
      arr.push(c);
      kidsByGroup.set(gid, arr);
    }

    // groups hierarchy (parent -> [child groups])
    const subGroupsByParent = new Map<string | null, GroupMeta[]>();
    for (const g of screen.groups ?? []) {
      const key = g.parentGroupId ?? null;
      const arr = subGroupsByParent.get(key) ?? [];
      arr.push(g);
      subGroupsByParent.set(key, arr);
    }

    // ⬇️ NEW: recursively check if a group (or any of its descendants) has children
    function groupHasAnyChildrenDeep(groupId: string): boolean {
      if ((kidsByGroup.get(groupId) ?? []).length > 0) return true;
      const subs = subGroupsByParent.get(groupId) ?? [];
      for (const sg of subs) {
        if (groupHasAnyChildrenDeep(sg.id)) return true;
      }
      return false;
    }

    function makeNodes(parentGroupId: string | null): TreeNode[] {
      console.log("subGroupsByParent", subGroupsByParent);

      const groupNodes = (subGroupsByParent.get(parentGroupId) ?? [])
        .filter((g) => groupHasAnyChildrenDeep(g.id))
        .map((g) => ({
          type: "group" as const,
          id: g.id,
          name: g.name ?? "Group",
          children: [
            // subgroup nodes first
            ...makeNodes(g.id),
            // then children inside this group
            ...(kidsByGroup.get(g.id) ?? []).map((c) => ({
              type: "child" as const,
              id: c.id,
              label: c.type, // or c.label ?? c.type
            })),
          ],
        }));

      // children directly under this parent (null == screen root)
      const childNodes = (kidsByGroup.get(parentGroupId) ?? []).map((c) => ({
        type: "child" as const,
        id: c.id,
        label: c.type,
      }));

      // Interleave: groups first, then ungrouped children (Figma-like)
      return [...groupNodes, ...childNodes];
    }

    return makeNodes(null);
  }

  // Remove group nodes that end up with no descendant children
  function pruneEmptyGroups(nodes: TreeNode[]): TreeNode[] {
    const out: TreeNode[] = [];
    for (const n of nodes) {
      if (n.type === "child") {
        out.push(n);
        continue;
      }
      const prunedKids = pruneEmptyGroups(n.children);
      if (prunedKids.length > 0) {
        out.push({ ...n, children: prunedKids });
      }
      // else: drop this empty group
    }
    return out;
  }

  return (
    <div
      className="w-64 h-full border-r bg-white overflow-auto text-sm z-50"
      // prevent clicks from bubbling to the canvas and clearing selection
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDragOver={(e) => {
        // allow panel-wide drag-over
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {screens.map((screen) => {
        // Prefer parent’s builder if provided
        // const tree = buildLayerTree
        //   ? buildLayerTree(screen)
        //   : buildScreenTree(screen);
        const rawTree = buildLayerTree
          ? buildLayerTree(screen)
          : buildScreenTree(screen);

        const tree = pruneEmptyGroups(rawTree);

        // Helpers that depend on this specific screen must live inside this scope:
        const tokFor = (childId: string) => childToken(screen.id, childId);

        const handleSelectChild = (childId: string, additive: boolean) => {
          const tok = tokFor(childId);
          setSelectedShapeIds((prev) => {
            if (additive) {
              return prev.includes(tok)
                ? prev.filter((t) => t !== tok)
                : [...prev, tok];
            }
            return [tok];
          });
        };

        // Deep collect of child TOKENS for a group (includes nested groups)
        const deepChildTokensForGroup = (groupId: string): string[] => {
          const groups = screen.groups ?? [];
          const children = screen.children ?? [];

          // parent -> children map
          const byParent = new Map<string, string[]>();
          for (const g of groups) {
            const key = (g.parentGroupId ?? "") as string;
            const arr = byParent.get(key) ?? [];
            arr.push(g.id);
            byParent.set(key, arr);
          }

          // collect all descendant group ids
          const allGroupIds = new Set<string>();
          const stack = [groupId];
          while (stack.length) {
            const gid = stack.pop()!;
            if (allGroupIds.has(gid)) continue;
            allGroupIds.add(gid);
            (byParent.get(gid) ?? []).forEach((sg) => stack.push(sg));
          }

          // gather all children whose groupId ∈ allGroupIds
          const childIds = children
            .filter((c) => {
              const gid = (c as any).groupId as string | undefined;
              return gid ? allGroupIds.has(gid) : false;
            })
            .map((c) => c.id);

          return childIds.map((id) => childToken(screen.id, id));
        };

        const handleSelectGroupDeep = (
          node: TreeNode & { type: "group" },
          additive: boolean
        ) => {
          // Prefer parent’s canonical selector if provided
          if (selectGroupTokens) {
            selectGroupTokens(screen.id, node.id, additive);
            return;
          }

          const toks = deepChildTokensForGroup(node.id);

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

        // ---------- DnD helpers in screen scope ----------
        type DragData =
          | { kind: "child"; screenId: string; childId: string }
          | { kind: "group"; screenId: string; groupId: string };

        const setDragData = (
          e: React.DragEvent,
          data: DragData,
          visual: { kind: "child" | "group"; id: string }
        ) => {
          // critical: include text/plain for browser compatibility
          e.dataTransfer.setData("text/plain", "layer-dnd");
          e.dataTransfer.setData("application/layer-dnd", JSON.stringify(data));
          e.dataTransfer.effectAllowed = "move";
          // visual drag image
          const img = getDragImage();
          try {
            e.dataTransfer.setDragImage(img, img.width / 2, img.height / 2);
          } catch {}
          setDragging({
            kind: visual.kind,
            screenId: screen.id,
            id: visual.id,
          });
        };

        const getDragData = (e: React.DragEvent): DragData | null => {
          try {
            const txt = e.dataTransfer.getData("application/layer-dnd");
            if (!txt) return null;
            return JSON.parse(txt);
          } catch {
            return null;
          }
        };

        // Prevent cycles: is `maybeChildId` somewhere under `parentId` in the group tree?
        const isDescendantGroup = (parentId: string, maybeChildId: string) => {
          const byParent = new Map<string | null, GroupMeta[]>();
          for (const g of screen.groups ?? []) {
            const pid = g.parentGroupId ?? null;
            const arr = byParent.get(pid) ?? [];
            arr.push(g);
            byParent.set(pid, arr);
          }
          const stack = [parentId];
          while (stack.length) {
            const gid = stack.pop()!;
            if (gid === maybeChildId) return true;
            const kids = byParent.get(gid) ?? [];
            for (const sg of kids) stack.push(sg.id);
          }
          return false;
        };
        // =========================

        const rowClasses = (
          base: string,
          isHover: boolean,
          isDraggingRow: boolean
        ) =>
          [
            base,
            isHover ? "ring-1 ring-blue-400 bg-blue-50/60" : "",
            isDraggingRow ? "opacity-50" : "",
          ]
            .filter(Boolean)
            .join(" ");

        const renderNode = (node: TreeNode, depth = 0) => {
          const leftPad = 8 + depth * 12;

          if (node.type === "child") {
            const tok = childToken(screen.id, node.id);
            const isSelected = selectedShapeIds.includes(tok);
            const isHovering =
              hoverTarget?.kind === "child" &&
              hoverTarget.screenId === screen.id &&
              hoverTarget.id === node.id;
            const isDraggingRow =
              dragging?.kind === "child" &&
              dragging.screenId === screen.id &&
              dragging.id === node.id;
            return (
              <div
                key={node.id}
                role="treeitem"
                aria-selected={isSelected}
                className={rowClasses(
                  `flex items-center h-7 px-2 cursor-pointer ${
                    isSelected ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                  }`,
                  isHovering,
                  isDraggingRow
                )}
                style={{ paddingLeft: leftPad }}
                onMouseDown={(e) => {
                  //e.preventDefault();
                  e.stopPropagation();
                  handleSelectChild(node.id, e.metaKey || e.ctrlKey);
                }}
                draggable
                onDragStart={(e) => {
                  setDragData(
                    e,
                    { kind: "child", screenId: screen.id, childId: node.id },
                    { kind: "child", id: node.id }
                  );
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setHoverTarget({
                    kind: "child",
                    screenId: screen.id,
                    id: node.id,
                  });
                  e.dataTransfer.dropEffect = "move";
                }}
                onDragLeave={() => {
                  setHoverTarget((ht) =>
                    ht && ht.kind === "child" && ht.id === node.id ? null : ht
                  );
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setHoverTarget(null);
                  const data = getDragData(e);
                  if (!data || data.screenId !== screen.id) return;

                  if (data.kind === "child") {
                    if (data.childId === node.id) return;
                    const targetChild = (screen.children ?? []).find(
                      (c) => c.id === node.id
                    );
                    const parentGroupId =
                      (targetChild as any)?.groupId === undefined
                        ? null
                        : (targetChild as any)?.groupId ?? null;
                    createGroupWith(
                      screen.id,
                      [data.childId, node.id],
                      parentGroupId
                    );
                  } else if (data.kind === "group") {
                    const targetChild = (screen.children ?? []).find(
                      (c) => c.id === node.id
                    );
                    const parentGroupId =
                      (targetChild as any)?.groupId === undefined
                        ? null
                        : (targetChild as any)?.groupId ?? null;
                    if (
                      parentGroupId &&
                      isDescendantGroup(data.groupId, parentGroupId)
                    ) {
                      return;
                    }
                    nestGroup(screen.id, data.groupId, parentGroupId);
                  }
                }}
              >
                <span className="i-square mr-2 opacity-60" />
                <span className="truncate">{node.label}</span>
              </div>
            );
          }

          // group row
          const allChildTokens: string[] = [];
          const collect = (n: TreeNode) => {
            if (n.type === "child")
              allChildTokens.push(childToken(screen.id, n.id));
            else n.children.forEach(collect);
          };
          node.children.forEach(collect);

          const isFullySelected =
            allChildTokens.length > 0 &&
            allChildTokens.every((t) => selectedShapeIds.includes(t));
          const isPartially =
            !isFullySelected &&
            allChildTokens.some((t) => selectedShapeIds.includes(t));

          const isHovering =
            hoverTarget?.kind === "group" &&
            hoverTarget.screenId === screen.id &&
            hoverTarget.id === node.id;
          const isDraggingRow =
            dragging?.kind === "group" &&
            dragging.screenId === screen.id &&
            dragging.id === node.id;

          return (
            <div key={node.id} role="group">
              <div
                role="treeitem"
                aria-selected={isFullySelected}
                className={rowClasses(
                  `flex items-center h-7 px-2 cursor-pointer ${
                    isFullySelected
                      ? "bg-blue-50 text-blue-700"
                      : isPartially
                      ? "bg-indigo-50/40"
                      : "hover:bg-gray-50"
                  }`,
                  isHovering,
                  isDraggingRow
                )}
                style={{ paddingLeft: leftPad }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleSelectGroupDeep(node as any, e.metaKey || e.ctrlKey);
                }}
                draggable
                onDragStart={(e) => {
                  setDragData(
                    e,
                    { kind: "group", screenId: screen.id, groupId: node.id },
                    { kind: "group", id: node.id }
                  );
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setHoverTarget({
                    kind: "group",
                    screenId: screen.id,
                    id: node.id,
                  });
                  e.dataTransfer.dropEffect = "move";
                }}
                onDragLeave={() => {
                  setHoverTarget((ht) =>
                    ht && ht.kind === "group" && ht.id === node.id ? null : ht
                  );
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setHoverTarget(null);
                  const data = getDragData(e);
                  if (!data || data.screenId !== screen.id) return;

                  if (data.kind === "child") {
                    moveChildToGroup(screen.id, data.childId, node.id);
                  } else if (data.kind === "group") {
                    if (data.groupId === node.id) return;
                    if (isDescendantGroup(data.groupId, node.id)) return;
                    nestGroup(screen.id, data.groupId, node.id);
                  }
                }}
              >
                {/* caret could go here later */}
                <span className="i-folder mr-2 opacity-60" />
                <span className="truncate">{node.name}</span>
              </div>
              {node.children.map((c) => renderNode(c, depth + 1))}
            </div>
          );
        };

        return (
          <div
            key={screen.id}
            className="border-b"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setHoverTarget({ kind: "root", screenId: screen.id });
              e.dataTransfer.dropEffect = "move";
            }}
            onDragLeave={() => {
              setHoverTarget((ht) =>
                ht && ht.kind === "root" && ht.screenId === screen.id
                  ? null
                  : ht
              );
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setHoverTarget(null);
              const txt = e.dataTransfer.getData("application/layer-dnd");
              if (!txt) return;
              try {
                const data = JSON.parse(txt) as
                  | { kind: "child"; screenId: string; childId: string }
                  | { kind: "group"; screenId: string; groupId: string };
                if (data.screenId !== screen.id) return;
                if ("childId" in data) {
                  moveChildToGroup(screen.id, data.childId, null);
                } else if ("groupId" in data) {
                  nestGroup(screen.id, data.groupId, null);
                }
              } catch {}
            }}
          >
            <div className="flex items-center h-8 px-2 text-xs uppercase tracking-wide text-gray-500 bg-gray-50">
              Screen: {screen.platform ?? "Screen"}
            </div>
            <div className="py-1">
              {tree.length ? (
                tree.map((n) => renderNode(n))
              ) : (
                <div
                  className="text-xs text-gray-400 px-3 py-2"
                  style={{ paddingLeft: 12 }}
                >
                  (empty)
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
