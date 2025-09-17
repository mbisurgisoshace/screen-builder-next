import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTitle,
  SheetHeader,
  SheetTrigger,
  SheetContent,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { MoreHorizontal } from "lucide-react";
import { Participant } from "@/lib/generated/prisma";
import { markParticipantAsComplete } from "@/services/participants";

interface ParticipantTableActionsProps {
  participant: Participant;
}

export default function ParticipantTableActions({
  participant,
}: ParticipantTableActionsProps) {
  const markAsComplete = async () => {
    await markParticipantAsComplete(participant.id);
  };

  return (
    <Sheet>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <SheetTrigger>Edit</SheetTrigger>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={markAsComplete}>
            Mark as Complete
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600" onClick={() => {}}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SheetContent>
        <SheetHeader className="border-b">
          <SheetTitle className="text-[26px] font-medium text-[#162A4F]">
            Edit Participant
          </SheetTitle>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
