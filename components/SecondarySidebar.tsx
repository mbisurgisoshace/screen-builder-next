import Link from "next/link";

import {
  SidebarMenu,
  SidebarGroup,
  SidebarMenuItem,
  SidebarMenuButton,
} from "./ui/sidebar";
import { usePathname } from "next/navigation";

interface SecondarySidebarProps {
  isAdminOrMentor: boolean;
  items: { name: string; url: string }[];
}

export default function SecondarySidebar({
  items,
  isAdminOrMentor,
}: SecondarySidebarProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {isAdminOrMentor && (
          <SidebarMenuItem key={"startups"}>
            <SidebarMenuButton
              asChild
              style={{
                opacity: pathname === "/startups" ? 1 : 0.6,
                color: pathname === "/startups" ? "#6A35FF" : "#111827",
                backgroundColor: pathname === "/startups" ? "#F4F0FF" : "",
              }}
            >
              <Link href={"/startups"}>
                <span>{`Startups`}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        {items.map((item) => {
          const isActive = pathname === item.url;
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                style={{
                  opacity: isActive ? 1 : 0.6,
                  color: isActive ? "#6A35FF" : "#111827",
                  backgroundColor: isActive ? "#F4F0FF" : "",
                }}
              >
                <Link href={item.url}>
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
