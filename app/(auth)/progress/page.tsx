import { MicIcon } from "lucide-react";
import ProgressCard from "./_components/ProgressCard";
import { getQuestions } from "@/services/questions";
import QuestionsCard from "./_components/QuestionsCard";

export default async function ProgressPage() {
  const questions = await getQuestions();
  const totalQuestions = questions?.data?.shapes?.data.length || 0;

  console.log("questions:", totalQuestions);

  return (
    <div className="p-8 h-full">
      <div className="border-2 rounded-2xl bg-white p-8 flex flex-col gap-6">
        <div className="flex flex-row gap-5 items-center">
          <div className="h-[50px] w-[50px] bg-[#EAE2FF] rounded-full flex items-center justify-center">
            <div className="h-[38px] w-[38px] bg-[#E0D5FF] rounded-full flex items-center justify-center">
              <MicIcon className="h-6 w-6 text-[#6A35FF]" />
            </div>
          </div>
          <h3 className="text-[#111827] text-xl font-bold">
            Interview Planning
          </h3>
        </div>

        <div className="flex flex-row gap-4">
          <ProgressCard amount={24} title={"of people planned to interview"} />
          <ProgressCard
            amount={19}
            title={"of people scheduled to interview"}
          />
          <QuestionsCard totalQuestions={totalQuestions} />
        </div>
      </div>
    </div>
  );
}
