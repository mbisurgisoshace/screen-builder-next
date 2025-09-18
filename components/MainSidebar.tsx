import Link from "next/link";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

interface CollapsibleSidebarProps {
  items: {
    title: string;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}

export default function CollapsibleSidebar({ items }: CollapsibleSidebarProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            //defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton 
                  tooltip={item.title}
                  style={{
                    fontFamily: "Manrope",
                    fontWeight: 700,
                    fontSize: "14px",
                    lineHeight: "20px",
                    letterSpacing: "0%",
                    color: "#697288",
                  }}
                >
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => {
                    const isActive =
                      pathname.includes(subItem.url) && pathname !== "/";
                    return (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          style={{
                            opacity: isActive ? 1 : 0.6,
                            color: isActive ? "#6A35FF" : "#697288",
                            backgroundColor: isActive ? "#F4F0FF" : "",
                            fontFamily: "Manrope",
                            fontWeight: 700,
                            fontSize: "13px",
                            lineHeight: "20px",
                            letterSpacing: "0%",
                          }}
                        >
                          <Link href={subItem.url} data-sidebar-link>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
