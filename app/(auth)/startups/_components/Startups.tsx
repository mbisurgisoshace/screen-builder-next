"use client";

import { useOrganizationList } from "@clerk/nextjs";
import StartupsTable from "./StartupsTable";

export default function Startups() {
  const { userMemberships, setActive } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });

  console.log("userMemberships", userMemberships);

  return (
    <StartupsTable
      data={
        userMemberships.data?.map((membership) => membership.organization) || []
      }
      onSelectOrganization={(organization: any) => {
        if (setActive) {
          setActive({
            redirectUrl: "/",
            organization,
          });
        }
      }}
    />
  );
}
