"use client";
import { create } from "zustand";

export type Guide =
  | { type: "v"; x: number; fromY: number; toY: number }
  | { type: "h"; y: number; fromX: number; toX: number };

type SmartGuidesState = {
  guides: Guide[];
  setGuides: (g: Guide[]) => void;
  clear: () => void;
};

export const useSmartGuidesStore = create<SmartGuidesState>((set) => ({
  guides: [],
  setGuides: (g) => set({ guides: g }),
  clear: () => set({ guides: [] }),
}));
