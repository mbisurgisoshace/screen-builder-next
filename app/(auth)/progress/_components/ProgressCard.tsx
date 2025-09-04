interface ProgressCardProps {
  title: string;
  amount: number;
}

export default function ProgressCard({ title, amount }: ProgressCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm w-[238px] min-w-[238px]">
      {/* Arco visible y dentro de la tarjeta */}
      <div className="absolute -top-[435px] -left-[135px] h-[506px] w-[506px] rounded-full z-0 pointer-events-none bg-[#6376F1] opacity-[18%]" />
      {/* Contenido */}
      <div className="relative z-10 flex flex-col items-center">
        <svg
          className="h-8 w-8 text-slate-400 mb-7"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="12" cy="8" r="4" stroke="currentColor" />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" />
        </svg>
        <div className="text-5xl font-semibold">{amount}</div>
        <p className="text-[11px] font-medium text-[#8B92A1]">{title}</p>
      </div>
    </div>
  );
}
