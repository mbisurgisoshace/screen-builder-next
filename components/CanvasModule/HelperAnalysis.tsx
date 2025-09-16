import { format } from "date-fns";
import {
  FileQuestionMarkIcon,
  MessageSquareTextIcon,
  SendHorizonalIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Input } from "../ui/input";
import { useRealtimeComments } from "./hooks/realtime/useRealtimeComments";
import { useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import Image from "next/image";

export function HelperAnalysis() {
  const [text, setText] = useState("");
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size={"sm"}
          data-nodrag="true"
          //variant={"secondary"}
          className="cursor-pointer"
        >
          <FileQuestionMarkIcon className="w-4 h-4" />
          Help
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[512px] min-w-[512px]" side="right">
        <SheetHeader className="border-b">
          <SheetTitle className="text-[26px] font-medium text-[#162A4F]">
            Analysis Help
          </SheetTitle>
        </SheetHeader>
        <div className="h-full flex flex-col gap-8">Analysis Help</div>
      </SheetContent>
    </Sheet>
  );
}
