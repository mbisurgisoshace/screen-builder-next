"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";
import { useAuth, useOrganizationList } from "@clerk/nextjs";

export default function SetActiveOrg() {
  const { setActive, isLoaded, userMemberships } = useOrganizationList();

  const { orgId } = useAuth();

  //console.log("orgId, userMemberships", orgId, userMemberships);

  useEffect(() => {
    if (!isLoaded) return;

    console.log("orgId, userMemberships", orgId, userMemberships);

    if (userMemberships.data.length === 0) {
      return redirect("/sign-in");
    }

    const organization = userMemberships.data[0].organization;

    setActive({
      redirectUrl: "/",
      organization: organization.id,
    });
  }, [orgId, isLoaded, setActive]);

  return null;
}
