"use client";

import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { getParticipant } from "@/services/participants";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AppHeader() {
  const { user } = useUser();
  const pathname = usePathname();
  const [header, setHeader] = useState<any>(null);

  const renderTitle = async (pathname: string) => {
    let title = "";

    if (pathname === "/") title = "To-do's";
    if (pathname === "/startups") title = "Startups";
    if (pathname.includes("/analysis")) title = "Interview Response Analysis";
    if (pathname.includes("/questions")) title = "Interview Questions";
    if (pathname.includes("/participants")) title = "Interview Participants";
    if (pathname.includes("/segments")) title = "Market/Customer/End-User Segments";
    if (pathname.includes("/progress")) title = "Progress snapshot";
    if (pathname.includes("/ecosystem-map")) title = "Ecosystem Map";
    if (pathname.includes("/idea-brainstorm")) title = "Idea Brainstorm";
    if (pathname.includes("/value-proposition")) title = "Value Proposition";
    if (pathname.includes("/customer-discovery")) title = "Customer Discovery";
    if (pathname.includes("/common-vocabulary")) title = "Common Vocabulary";
    if (pathname.includes("/examples/laptop")) title = "Laptop Value Prop Example";
    if (pathname.includes("/examples/pickup-truck")) title = "Pickup Truck Value Prop Example";
    if (pathname.includes("/examples/ecosystem-maps")) title = "Ecosystem Map Examples";


    if (pathname.includes("/participants/")) {
      const participantId = pathname.split("/participants/")[1];
      const participant = await getParticipant(participantId);

      setHeader(
        <div>
          <Link href={"/participants"}>{title}</Link>
          <span>{" > "}</span>
          <span>{participant?.name}</span>
        </div>
      );
    } else {
      setHeader(title);
    }
  };

  useEffect(() => {
    renderTitle(pathname);
  }, [pathname]);

  return (
    <header className="flex items-center px-4 h-[46px] bg-white border-b-[0.5px] border-b-[#E4E5ED] justify-between font-semibold text-lg text-[#111827]">
      {header}

      <div className="flex items-center flex-row gap-2.5">
        <UserButton />
        <span className="text-xs font-bold text-[#111827]">
          {user?.fullName || user?.primaryEmailAddress?.emailAddress}
        </span>
      </div>
    </header>
  );
}
