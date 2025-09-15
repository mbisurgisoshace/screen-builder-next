"use client";

import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Mentors from "@/app/(auth)/_components/Mentors";
import AboutProgram from "@/app/(auth)/_components/AboutProgram";

export default function AppHeader() {
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [isMentorsOpen, setIsMentorsOpen] = useState(false);
  const [isAboutProgramOpen, setIsAboutProgramOpen] = useState(false);

  let title = "";

  if (pathname === "/") title = "To-do's";
  if (pathname === "/startups") title = "Startups";
  if (pathname.includes("/participants")) title = "Interviews";
  if (pathname.includes("/progress")) title = "Progress snapshot";
  if (pathname.includes("/idea-brainstorm")) title = "Idea Brainstorm";
  if (pathname.includes("/value-proposition")) title = "Value proposition";
  if (pathname.includes("/customer-discovery")) title = "Customer Discovery";
  if (pathname.includes("/common-vocabulary")) title = "Common Vocabulary";
  if (pathname.includes("/examples/laptop")) title = "Laptop Example";
  if (pathname.includes("/examples/pickup-truck"))
    title = "Pickup Truck Example";

  return (
    <header className="flex items-center px-4 h-[46px] bg-white border-b-[0.5px] border-b-[#E4E5ED] justify-between font-semibold text-lg text-[#111827]">
      {title}

      <div className="flex gap-3">
        <Button
          onClick={() => setIsMentorsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          View Mentors
        </Button>
        <Button
          onClick={() => setIsAboutProgramOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          View About Program
        </Button>
        <Button
          onClick={() => router.push("/customer-discovery")}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Customer Discovery
        </Button>
        <Button
          onClick={() => router.push("/common-vocabulary")}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Common Vocabulary
        </Button>
      </div>
      <div className="flex items-center flex-row gap-2.5">
        <UserButton />
        <span className="text-xs font-bold text-[#111827]">
          {user?.fullName}
        </span>
      </div>
      <Mentors
        isOpen={isMentorsOpen}
        onClose={() => setIsMentorsOpen(false)}
      />
      <AboutProgram
        isOpen={isAboutProgramOpen}
        onClose={() => setIsAboutProgramOpen(false)}
      />
    </header>
  );
}
