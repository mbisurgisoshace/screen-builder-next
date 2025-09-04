interface QuestionsCardProps {
  totalQuestions: number;
}

export default function QuestionsCard({ totalQuestions }: QuestionsCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm w-full flex gap-9 flex-col">
      <h3 className="font-bold text-xl text-[#111827]">Questions</h3>
      <div className="flex gap-6 items-center">
        <div className="size-[68px] bg-[#F4F0FF] flex items-center justify-center rounded-full">
          <div className="size-[56px] rounded-full bg-white"></div>
        </div>
        <div>
          <div>
            <span className="text-[45px] font-semibold text-[#111827]">0</span>
            <span className="text-[#8B92A1] text-[20px] font-bold">{` / ${totalQuestions}`}</span>
          </div>
          <span className="text-[11px] text-[#8B92A1] font-medium -mt-3 block">
            questions asked
          </span>
        </div>
      </div>
    </div>
  );
}
