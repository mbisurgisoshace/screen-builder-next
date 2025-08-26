"use client";
import dynamic from "next/dynamic";
import { EllipsisIcon, MicIcon } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorState, convertFromRaw, convertToRaw } from "draft-js";

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";

type FeatureIdeaProps = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
};

export const FeatureIdea: React.FC<FeatureIdeaProps> = (props) => {
  const { shape } = props;

  return (
    <ShapeFrame
      {...props}
      resizable={true}
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      <div className="w-full h-full bg-white border-1 border-[#E9E6F0] rounded-xl shadow flex flex-col overflow-hidden px-8 py-6 gap-4">
        FeatureIdea skeleton
      </div>
    </ShapeFrame>
  );
};
