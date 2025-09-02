import Image from "next/image";
import { ChevronRight, DotIcon } from "lucide-react";

import {
  Sidebar,
  SidebarMenu,
  SidebarRail,
  SidebarGroup,
  SidebarHeader,
  SidebarContent,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { UserButton } from "@clerk/nextjs";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Discovery",
      url: "#",
      items: [
        {
          title: "Questions",
          url: "#",
          isActive: true,
        },
        {
          title: "People",
          url: "#",
        },
        {
          title: "Interviews",
          url: "#",
        },
        {
          title: "Analysis",
          url: "#",
        },
      ],
    },
    {
      title: "Needs",
      url: "#",
      items: [],
    },
    {
      title: "Solutions",
      url: "#",
      items: [],
    },
    {
      title: "Traction",
      url: "#",
      items: [],
    },
    {
      title: "Features",
      url: "#",
      items: [],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="bg-white" {...props}>
      <SidebarHeader className="bg-white">
        <Image
          width={230}
          height={50}
          src={"/logo.jpg"}
          alt="Nutech Ventures"
        />
      </SidebarHeader>
      <SidebarContent className="p-4 bg-white border-t flex justify-between">
        {/* We create a collapsible SidebarGroup for each parent. */}
        <div>
          {data.navMain.map((item) => (
            <Collapsible
              key={item.title}
              title={item.title}
              defaultOpen
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel
                  asChild
                  className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
                >
                  <CollapsibleTrigger className="text-[#111827] opacity-60 text-[12px] font-bold">
                    {item.title}{" "}
                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {item.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={item.isActive}>
                            <div
                              className={`text-[12px] font-bold`}
                              style={{
                                opacity: item.isActive ? 1 : 0.6,
                                color: item.isActive ? "#6A35FF" : "#111827",
                                backgroundColor: item.isActive ? "#F4F0FF" : "",
                              }}
                            >
                              <DotIcon height={4} width={4} />
                              <a href={item.url}>{item.title}</a>
                            </div>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          ))}
        </div>

        <UserButton />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
