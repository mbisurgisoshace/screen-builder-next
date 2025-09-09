import { useOrganizationList } from "@clerk/nextjs";

export default function useStartups() {
  const { userMemberships, setActive } = useOrganizationList({
    userMemberships: {
      //infinite: true,
    },
  });

  return {
    setActive,
    startups: userMemberships.data?.map(
      (membership) => membership.organization
    ),
  };
}
