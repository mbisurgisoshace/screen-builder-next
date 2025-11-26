"use client";
import React, { useState } from "react";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";
import { Shape as IShape } from "../../types";
import { useRegisterToolbarExtras } from "../toolbar/toolbarExtrasStore";

type TabsBlockProps = {
  shape: IShape;
} & Omit<ShapeFrameProps, "shape" | "children">;

export const TabsBlock: React.FC<TabsBlockProps> = (props) => {
  const {
    shape,
    onCommitStyle,
    isSelected,
    selectedCount,
    onMouseDown,
    onResizeStart,
  } = props;
  const { tabs } = shape;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);

  const activeId =
    shape.activeTabId ?? (tabs?.length > 0 ? tabs[0].id : undefined);

  // ---- Toolbar: add/remove tabs ----
  useRegisterToolbarExtras(
    shape.id,
    () =>
      isSelected && (
        <div className="flex items-center gap-2 z-100">
          <button
            className="px-2 py-1 text-xs rounded bg-gray-100 border hover:bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              const newTab = {
                id: crypto.randomUUID(),
                label: `Tab ${tabs.length + 1}`,
              };
              onCommitStyle?.(shape.id, {
                tabs: [...tabs, newTab],
              });
            }}
          >
            + Tab
          </button>

          {tabs?.length > 1 && (
            <button
              className="px-2 py-1 text-xs rounded bg-gray-100 border hover:bg-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                const trimmed = tabs.slice(0, -1);
                const removed = tabs[tabs.length - 1];
                const newActive =
                  activeId === removed.id
                    ? trimmed[0]?.id ?? undefined
                    : activeId;

                onCommitStyle?.(shape.id, {
                  tabs: trimmed,
                  activeTabId: newActive,
                });
              }}
            >
              − Tab
            </button>
          )}

          {/* Border Radius */}
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Radius</span>
            <button
              className="px-2 py-1 rounded bg-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                onCommitStyle?.(shape.id, {
                  borderRadius: 0,
                });
              }}
            >
              None
            </button>
            <button
              className="px-2 py-1 rounded bg-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                onCommitStyle?.(shape.id, { borderRadius: 5 });
              }}
            >
              <span className="">Small</span>
            </button>
            <button
              className="px-2 py-1 rounded bg-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                onCommitStyle?.(shape.id, { borderRadius: 15 });
              }}
            >
              <span className="">Medium</span>
            </button>
            <button
              className="px-2 py-1 rounded bg-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                onCommitStyle?.(shape.id, { borderRadius: 100 });
              }}
            >
              <span className="">Rounded</span>
            </button>
          </div>
        </div>
      ),
    [shape.id, isSelected, tabs, activeId, onCommitStyle]
  );

  // ---- Commit label edit ----
  const commitLabel = () => {
    if (!editingId) return;
    const nextTabs = tabs?.map((t) =>
      t.id === editingId ? { ...t, label: editingValue || t.label } : t
    );
    onCommitStyle?.(shape.id, { tabs: nextTabs });
    setEditingId(null);
    setEditingValue("");
  };

  return (
    <ShapeFrame
      {...props}
      shape={shape}
      isSelected={isSelected}
      onMouseDown={onMouseDown}
      onResizeStart={onResizeStart}
      selectedCount={selectedCount}
      showTagsToolbar={false}
      showConnectors={props.isSelected && props.selectedCount === 1}
      resizable={true}
    >
      <div
        className="w-full h-full flex items-center justify-stretch px-1 py-1 rounded-full bg-gray-100"
        style={{ overflow: "hidden", borderRadius: shape.borderRadius || 4 }}
      >
        {tabs?.map((tab) => {
          const isActive = tab.id === activeId;
          const isEditing = editingId === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              className={`relative flex flex-1 h-full items-center justify-center px-4 py-1 text-sm transition-all ${
                isActive
                  ? "bg-black text-white rounded-full shadow-sm"
                  : "text-gray-800"
              }`}
              style={{
                borderRadius: shape.borderRadius || 4,
                //borderRadius: isActive ? 999 : 999,
                marginRight: 4,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onCommitStyle?.(shape.id, { activeTabId: tab.id });
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingId(tab.id);
                setEditingValue(tab.label);
              }}
            >
              {isEditing ? (
                <input
                  autoFocus
                  className="px-2 py-0.5 text-sm rounded bg-white text-gray-900 border outline-none"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitLabel();
                    } else if (e.key === "Escape") {
                      setEditingId(null);
                    }
                  }}
                  onBlur={commitLabel}
                />
              ) : (
                <span>{tab.label}</span>
              )}
            </button>
          );
        })}
        {/* {tabs?.map((tab, index) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeId}
            isEditing={editingId === tab.id}
            isSelected={selectedTabId === tab.id}
            index={index}
            total={tabs.length}
            editingValue={editingValue}
            onClickTab={(e) => {
              e.stopPropagation();
              onCommitStyle?.(shape.id, { activeTabId: tab.id });
            }}
            onDoubleClickTab={(e) => {
              e.stopPropagation();
              setEditingId(tab.id);
              setEditingValue(tab.label);
            }}
            onToggleSelectForStyling={() => {
              // internal “selection” just for styling controls later
              setSelectedTabId((prev) => (prev === tab.id ? null : tab.id));
            }}
            onEditChange={(val) => setEditingValue(val)}
            onEditCommit={commitLabel}
            onEditCancel={() => {
              setEditingId(null);
              setEditingValue("");
            }}
          />
        ))} */}
      </div>
    </ShapeFrame>
  );
};

/**
 * Individual tab chip.
 * For now it’s purely visual + edit handling, but having it split out
 * will let us:
 *  - pass style props (bg, text color, radius) per-tab later
 *  - show a separate “selected for styling” outline
 */
type TabItemProps = {
  tab: { id: string; label: string };
  isActive: boolean;
  isEditing: boolean;
  isSelected: boolean;
  index: number;
  total: number;
  editingValue: string;
  onClickTab: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onDoubleClickTab: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onToggleSelectForStyling: () => void;
  onEditChange: (value: string) => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
};

const TabItem: React.FC<TabItemProps> = ({
  tab,
  isActive,
  isEditing,
  isSelected,
  index,
  total,
  editingValue,
  onClickTab,
  onDoubleClickTab,
  onToggleSelectForStyling,
  onEditChange,
  onEditCommit,
  onEditCancel,
}) => {
  return (
    <button
      type="button"
      className={`
        relative
        flex-1
        h-full
        flex items-center justify-center
        text-sm
        transition-all
        ${isActive ? "text-white" : "text-gray-800"}
      `}
      style={{
        marginRight: index < total - 1 ? 4 : 0,
        borderRadius: 999,
        backgroundColor: isActive ? "#000000" : "transparent",
        outline: isSelected ? "2px solid #60A5FA" : "none", // 👈 internal styling selection
        outlineOffset: 1,
      }}
      onClick={onClickTab}
      onDoubleClick={onDoubleClickTab}
      onContextMenu={(e) => {
        // Right-click (or maybe Alt+click) can toggle "styling selection"
        e.preventDefault();
        e.stopPropagation();
        onToggleSelectForStyling();
      }}
    >
      {isEditing ? (
        <input
          autoFocus
          className="px-2 py-0.5 text-sm rounded bg-white text-gray-900 border outline-none w-[80%] min-w-0"
          value={editingValue}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEditCommit();
            } else if (e.key === "Escape") {
              onEditCancel();
            }
          }}
          onBlur={onEditCommit}
        />
      ) : (
        <span className="truncate">{tab.label}</span>
      )}
    </button>
  );
};
