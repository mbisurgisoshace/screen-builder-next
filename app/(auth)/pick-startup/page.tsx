import { OrganizationList } from "@clerk/nextjs";

export default function PickStartupPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <OrganizationList hidePersonal afterSelectOrganizationUrl={"/"} />
    </div>
  );
}
