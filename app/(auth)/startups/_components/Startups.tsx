"use client";

import { useEffect, useState } from "react";
import { useOrganizationList } from "@clerk/nextjs";

import StartupsTable from "./StartupsTable";

export default function Startups() {
  const [data, setData] = useState<any[]>([]);
  const { userMemberships, setActive, isLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
      pageSize: 100,
    },
  });

  const getData = async () => {
    const startups =
      userMemberships.data?.map((membership) => membership.organization) || [];

    const data = [];

    for (let i = 0; i < startups.length; i++) {
      const startup = startups[i];
      const memberships = await startup.getMemberships();
      const founders = memberships.data.filter(
        (membership) => membership.role === "org:founder"
      );
      const mentors = memberships.data.filter(
        (membership) => membership.role === "org:mentor"
      );

      data.push({
        org_id: startup.id,
        name: startup.name,
        createdAt: startup.createdAt,
        founders: founders.map(
          (founder) =>
            `${founder.publicUserData?.firstName} ${founder.publicUserData?.lastName}`
        ),
        mentors: mentors.map(
          (mentor) =>
            `${mentor.publicUserData?.firstName} ${mentor.publicUserData?.lastName}`
        ),
      });
    }

    setData(data);
  };

  useEffect(() => {
    getData();
  }, [userMemberships.data?.length]);

  return (
    <StartupsTable
      data={data}
      onSelectOrganization={(organization: any) => {
        if (setActive) {
          setActive({
            redirectUrl: "/",
            organization: organization.org_id,
          });
        }
      }}
    />
  );
}
