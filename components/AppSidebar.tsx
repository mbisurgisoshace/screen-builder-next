"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  DotIcon,
  FolderClosedIcon,
  FolderIcon,
} from "lucide-react";

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
import { useOrganization, UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

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
          title: "Participants",
          url: "/participants",
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
  const { user } = useUser();
  const pathname = usePathname();
  const { organization } = useOrganization();

  return (
    <Sidebar className="bg-white" {...props}>
      <SidebarHeader className="bg-white p-5 flex gap-6">
        <Image
          width={230}
          height={50}
          src={"/logo.jpg"}
          alt="Nutech Ventures"
        />

        <div className="h-8 border-1 border-[#EBECF4] rounded-[8px] flex flex-row gap-2.5 items-center px-2">
          <FolderClosedIcon className="h-4 w-4" />
          <span className="text-xs font-bold text-[#111827]">
            {organization?.name}
          </span>
        </div>
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
                      {item.items.map((item) => {
                        const isActive = pathname.includes(item.url);
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={isActive}>
                              <div
                                className={`text-[12px] font-bold`}
                                style={{
                                  opacity: isActive ? 1 : 0.6,
                                  color: isActive ? "#6A35FF" : "#111827",
                                  backgroundColor: isActive ? "#F4F0FF" : "",
                                }}
                              >
                                <DotIcon height={4} width={4} />
                                <Link href={item.url}>{item.title}</Link>
                              </div>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          ))}
        </div>

        <div className="flex items-center flex-row gap-2.5">
          <UserButton />
          <span className="text-xs font-bold text-[#111827]">
            {user?.fullName}
          </span>
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
