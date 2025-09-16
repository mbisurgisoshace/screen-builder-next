import { Play } from "lucide-react";
import { Attachment } from "./types";
import { Dialog, DialogHeader, DialogTrigger } from "../ui/dialog";
import { isImage, isPdf, isVideo } from "./blocks/CardFrame";
import { DialogContent, DialogTitle } from "@radix-ui/react-dialog";

interface AttachmentTileProps {
  attachment: Attachment;
}

export function AttachmentTileDialog({ attachment }: AttachmentTileProps) {
  const src = attachment.url || attachment.preview;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="relative w-[125px] h-[130px] rounded-md overflow-hidden border bg-white group"
        >
          {isImage(attachment.mime) ? (
            <img
              src={attachment.preview || attachment.url}
              alt={attachment.name}
              className="object-cover w-full h-full"
              draggable={false}
            />
          ) : isVideo(attachment.mime) ? (
            <div className="w-full h-full grid place-items-center bg-black/5">
              <Play className="w-7 h-7 opacity-70" />
            </div>
          ) : isPdf(attachment.mime) ? (
            <div className="w-full h-full grid place-items-center text-xs p-2 text-center">
              📄 {attachment.name}
            </div>
          ) : (
            <div className="w-full h-full grid place-items-center text-xs p-2 text-center">
              ⬇︎ {attachment.name}
            </div>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Test</DialogTitle>
        </DialogHeader>
        <div>test</div>
      </DialogContent>
    </Dialog>
  );
}
