import AppHeader from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="bg-[#EFF0F4] h-full w-full">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
