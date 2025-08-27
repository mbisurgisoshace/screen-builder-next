"use client";

import React, { useEffect, useRef } from "react";

import { v4 as uuidv4 } from "uuid";
import { Attachment, Shape, ShapeComponent } from "../types";
import { ShapeFrame, ShapeFrameProps } from "./BlockFrame";
import { PlusIcon, XIcon } from "lucide-react";
import { uploadToSupabase } from "@/lib/uploadToSupabase";

type CardFrame = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: Shape;
  body: React.ReactNode;
  header: React.ReactNode;
  onCommitStyle?: (id: string, patch: Partial<Shape>) => void;
};

export const CardFrame: React.FC<CardFrame> = (props) => {
  const { shape, body, header, onCommitStyle } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const attachments: Attachment[] = Array.isArray((shape as any).attachments)
    ? ((shape as any).attachments as Attachment[])
    : [];

  const attRef = useRef<Attachment[]>(attachments);
  useEffect(() => {
    attRef.current = attachments;
  }, [attachments]);

  const commit = (patch: Partial<Shape>) => onCommitStyle?.(shape.id, patch);

  function setAttachments(next: Attachment[]) {
    commit({ attachments: next as any });
  }

  function setAttachmentsNext(
    next: Attachment[] | ((prev: Attachment[]) => Attachment[])
  ) {
    const base = attRef.current ?? [];
    const value = typeof next === "function" ? next(base) : next;
    commit({ attachments: value as any });
  }

  function upsertAttachment(id: string, patch: Partial<Attachment>) {
    setAttachmentsNext((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
    );
  }

  function removeAttachment(id: string) {
    setAttachmentsNext((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleFiles(files: FileList | File[]) {
    const imgs = Array.from(files).filter((f) => /^image\//.test(f.type));
    if (imgs.length === 0) return;

    for (const file of imgs) {
      const id = uuidv4();
      const name = file.name;
      const mime = file.type || "application/octet-stream";

      const localUrl = URL.createObjectURL(file);
      let preview: string | undefined;
      try {
        preview = await makeBase64Thumb(file, 320);
      } catch {}

      // 👇 add using functional update (no stale array)
      setAttachmentsNext((prev) => [
        ...prev,
        {
          id,
          name,
          mime,
          url: localUrl, // instant local preview for *this* user
          preview, // tiny preview so collaborators see something
          uploading: true,
          progress: 0,
          createdAt: Date.now(),
        },
      ]);

      try {
        let last = 0;
        const { url } = await uploadToSupabase(file, (p) => {
          // throttle updates a bit
          if (p - last >= 0.05 || p === 1) {
            last = p;
            upsertAttachment(id, { progress: p });
          }
        });

        // swap to canonical URL
        upsertAttachment(id, { url, uploading: false, progress: 1 });

        try {
          URL.revokeObjectURL(localUrl);
        } catch {}
      } catch {
        // mark failed
        upsertAttachment(id, { uploading: false });
      }
    }
  }

  function onPickClick(e: React.MouseEvent) {
    e.stopPropagation();
    fileInputRef.current?.click();
  }

  function onDropAttachments(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  }

  return (
    <ShapeFrame
      {...props}
      resizable={true}
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      <div className="w-full h-full bg-white border-2 border-white rounded-xl shadow flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2 bg-gradient-to-r from-indigo-200 to-indigo-100 text-[#6376F2] font-semibold flex items-center justify-between">
          {header}
        </div>

        {body}
        {/* <Component {...props} /> */}

        {/* Attachments */}
        <div className="bg-white h-full px-10 mt-6">
          <span className="opacity-50 text-[#2B2B2C] text-xs font-semibold">
            Attachments
          </span>
          {/* <div className="mt-4 flex flex-row gap-3">
            <div className="bg-[#EEF4FB] w-[125px] h-[130px] flex items-center justify-center">
              <PlusIcon />
            </div>
            <div></div>
          </div> */}
          <div className="mt-4 flex flex-wrap gap-3 items-start">
            {/* Add tile */}
            <button
              type="button"
              onClick={onPickClick}
              className="bg-[#EEF4FB] w-[125px] h-[130px] rounded-md flex items-center justify-center hover:opacity-90 transition cursor-pointer"
              title="Add attachment"
            >
              <PlusIcon />
            </button>

            {/* Hidden input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length) handleFiles(files);
                // reset so picking the same file again still fires change
                e.currentTarget.value = "";
              }}
            />

            {/* Thumbnails */}
            {(attachments ?? []).map((att) => (
              <AttachmentCard
                key={att.id}
                att={att}
                onRemove={() => removeAttachment(att.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </ShapeFrame>
  );
};

function AttachmentCard({
  att,
  onRemove,
}: {
  att: {
    id: string;
    name: string;
    mime: string;
    url?: string;
    preview?: string;
    uploading?: boolean;
    progress?: number;
  };
  onRemove: () => void;
}) {
  const isImg = att.mime.startsWith("image/");
  const src = att.url || att.preview;

  return (
    <div className="relative w-[125px] h-[130px] rounded-md overflow-hidden border bg-white">
      {/* image / placeholder */}
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="block w-full h-full"
        onClick={(e) => {
          // prevent selecting/dragging the shape
          e.stopPropagation();
        }}
      >
        {isImg && src ? (
          <img
            src={src}
            alt={att.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-xs text-gray-500">
            {att.name}
          </div>
        )}
      </a>

      {/* remove button */}
      <button
        title="Remove"
        className="absolute top-1 right-1 p-1 rounded bg-white/90 hover:bg-white shadow"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <XIcon className="w-3 h-3" />
      </button>

      {/* progress overlay */}
      {att.uploading && (
        <div className="absolute inset-0 bg-black/10 grid place-items-end">
          <div className="w-full h-1 bg-white/50">
            <div
              className="h-1 bg-indigo-500 transition-[width]"
              style={{ width: `${Math.round((att.progress ?? 0) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

async function makeBase64Thumb(file: File, max = 320): Promise<string> {
  const bmp = await fileToImageBitmap(file);
  const ratio = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * ratio));
  const h = Math.max(1, Math.round(bmp.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
  try {
    (bmp as any).close?.();
  } catch {}
  return dataUrl;
}

function fileToImageBitmap(file: File): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        createImageBitmap(img).then(resolve).catch(reject);
      };
      img.onerror = reject;
      img.src = String(fr.result);
    };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}
