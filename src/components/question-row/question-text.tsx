import type { QPart } from "@/lib/checklist/types";

export function QuestionText({ parts }: { parts: QPart[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.bold ? (
          <strong key={i} className="font-bold text-[#1A322F]">
            {p.text}
          </strong>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}
