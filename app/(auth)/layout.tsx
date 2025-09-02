import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex items-center px-4 h-[46px] bg-white border-b-[0.5px] border-b-[#E4E5ED] justify-between font-semibold text-lg text-[#111827]">
          Questions
        </header>
        <div className="bg-[#EFF0F4] h-full">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
