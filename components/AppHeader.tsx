"use client";

import { usePathname } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();

  let title = "";

  if (pathname === "/") title = "To-do’s";
  if (pathname.includes("/participants")) title = "Interviews";
  if (pathname.includes("/progress")) title = "Progress snapshot";
  if (pathname.includes("/value-proposition")) title = "Value proposition";

  return (
    <header className="flex items-center px-4 h-[46px] bg-white border-b-[0.5px] border-b-[#E4E5ED] justify-between font-semibold text-lg text-[#111827]">
      {title}
    </header>
  );
}
