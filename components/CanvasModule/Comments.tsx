import { format } from "date-fns";
import { MessageSquareTextIcon, SendHorizonalIcon } from "lucide-react";
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

export function Comments() {
  const [text, setText] = useState("");
  const { user } = useUser();
  const { comments, addComment, removeComment } = useRealtimeComments();

  const onSend = async () => {
    const value = text.trim();
    if (!value) return;
    addComment({
      text: value,
      authorId: user?.id || "anon",
      authorName: user?.fullName || "",
      authorAvatar: user?.imageUrl || "",
    });
    setText("");
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size={"sm"}
          data-nodrag="true"
          //variant={"secondary"}
          className="cursor-pointer"
        >
          <MessageSquareTextIcon className="w-4 h-4" />
          Comments
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[512px] min-w-[512px]">
        <SheetHeader className="border-b">
          <SheetTitle className="text-[26px] font-medium text-[#162A4F]">
            Comments
          </SheetTitle>
        </SheetHeader>
        <div className="h-full flex flex-col gap-8">
          {comments.map((comment) => (
            <div key={comment.id} className="px-8 flex gap-4 flex-col">
              <div className="flex flex-row justify-between">
                <div className="flex items-center">
                  <Image
                    width={30}
                    height={30}
                    className="rounded-full"
                    src={comment.authorAvatar || ""}
                    alt={comment.authorName || "Authorname"}
                  />
                  <div className="ml-[10px] flex flex-col">
                    <h3 className="text-[#162A4F] text-[16px] font-medium">
                      {comment.authorName}
                    </h3>
                    <span className="text-[#5E6D8C] text-[12px]">Mentor</span>
                  </div>
                </div>
                <span className="text-[#5E6D8C] text-[12px]">
                  {format(comment.createdAt, "MMM d, k:mm")}
                </span>
              </div>
              <p className="text-[#162A4F] text-[14px]">{comment.text}</p>
            </div>
          ))}
        </div>
        <SheetFooter className="border-t flex items-center flex-row">
          <Input
            value={text}
            className="h-[60px]"
            placeholder="Type your comment here..."
            onChange={(e) => setText(e.target.value)}
          />
          <Button
            onClick={onSend}
            disabled={!text.trim()}
            className="bg-[#162A4F] rounded-full w-[44px] h-[44px] cursor-pointer"
          >
            <SendHorizonalIcon />
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
