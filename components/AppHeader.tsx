"use client";

import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";

export default function AppHeader() {
  const { user } = useUser();
  const pathname = usePathname();

  let title = "";

  if (pathname === "/") title = "To-do's";
  if (pathname === "/startups") title = "Startups";
  if (pathname.includes("/participants")) title = "Interviews";
  if (pathname.includes("/segments")) title = "Market Segments";
  if (pathname.includes("/progress")) title = "Progress snapshot";
  if (pathname.includes("/ecosystem-map")) title = "Ecosystem Map";
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

      <div className="flex items-center flex-row gap-2.5">
        <UserButton />
        <span className="text-xs font-bold text-[#111827]">
          {user?.fullName}
        </span>
      </div>
    </header>
  );
}
