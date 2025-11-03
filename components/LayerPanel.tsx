import React from "react";
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
};

export const LayerPanel: React.FC<LayerPanelProps> = ({
  screens,
  selectedShapeIds,
  childToken,
  parseChildToken,
  setSelectedShapeIds,
  selectGroupTokens,
  buildLayerTree,
}) => {
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

    function makeNodes(parentGroupId: string | null): TreeNode[] {
      const groupNodes = (subGroupsByParent.get(parentGroupId) ?? []).map(
        (g) => ({
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
        })
      );

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

  return (
    <div
      className="w-64 h-full border-r bg-white overflow-auto text-sm z-50"
      // prevent clicks from bubbling to the canvas and clearing selection
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {screens.map((screen) => {
        // Prefer parent’s builder if provided
        const tree = buildLayerTree
          ? buildLayerTree(screen)
          : buildScreenTree(screen);

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

        const renderNode = (node: TreeNode, depth = 0) => {
          const leftPad = 8 + depth * 12;

          if (node.type === "child") {
            const tok = childToken(screen.id, node.id);
            const isSelected = selectedShapeIds.includes(tok);
            return (
              <div
                key={node.id}
                role="treeitem"
                aria-selected={isSelected}
                className={`flex items-center h-7 px-2 cursor-pointer ${
                  isSelected ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                }`}
                style={{ paddingLeft: leftPad }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelectChild(node.id, e.metaKey || e.ctrlKey);
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

          return (
            <div key={node.id} role="group">
              <div
                role="treeitem"
                aria-selected={isFullySelected}
                className={`flex items-center h-7 px-2 cursor-pointer ${
                  isFullySelected
                    ? "bg-blue-50 text-blue-700"
                    : isPartially
                    ? "bg-indigo-50/40"
                    : "hover:bg-gray-50"
                }`}
                style={{ paddingLeft: leftPad }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleSelectGroupDeep(node as any, e.metaKey || e.ctrlKey);
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
          <div key={screen.id} className="border-b">
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
