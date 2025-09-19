import { LoaderIcon } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <LoaderIcon className="animate-spin text-[#6A35FF]" />
    </div>
  );
}
