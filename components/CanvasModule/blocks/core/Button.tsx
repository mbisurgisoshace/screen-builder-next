"use client";
import * as React from "react";
import type { Shape } from "../../types";

export const Button: React.FC<{ shape: Shape }> = ({ shape }) => {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="px-4 py-1.5 rounded-md border text-sm font-medium truncate"
        style={{
          background: "#111827",
          color: "#fff",
          borderColor: "rgba(0,0,0,0.2)",
        }}
      >
        {shape.label ?? "Button"}
      </div>
    </div>
  );
};
