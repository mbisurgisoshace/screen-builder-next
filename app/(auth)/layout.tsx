import AppHeader from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { checkRole } from "@/lib/auth";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdminOrMentor =
    (await checkRole("admin")) || (await checkRole("mentor"));

  return (
    <SidebarProvider>
      <AppSidebar isAdminOrMentor={isAdminOrMentor} />
      <SidebarInset>
        <AppHeader />
        <div className="bg-[#EFF0F4] h-full w-full">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
