"use client";

import { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { sections } from "@/lib/checklist/data";
import { partsToString } from "@/lib/checklist/bolding";
import { AnswerButton } from "@/components/engagement-profile/answer-button";
import { QuestionText } from "./question-text";
import { NoteToggle } from "./note-toggle";
import type { SubmissionInput } from "@/lib/checklist/schema";
import type { ChecklistQuestion } from "@/lib/checklist/types";

// Build a lookup map once at module load
const questionMap: Map<string, ChecklistQuestion> = new Map(
  sections.flatMap((s) => s.questions.map((q) => [q.id, q])),
);

interface QuestionRowProps {
  question: ChecklistQuestion;
  isMissing: boolean;
  disabled?: boolean;
}

function QuestionRowInner({ question, isMissing, disabled = false }: QuestionRowProps) {
  const { control } = useFormContext<SubmissionInput>();
  const q = questionMap.get(question.id) ?? question;
  const answerPath = `answers.${q.id}.value` as "answers.q1.value";

  return (
    <Controller
      name={answerPath}
      control={control}
      render={({ field }) => {
        const value = (field.value ?? "") as string;
        const isNo = value === "no";
        // NoteToggle reads its own value via useWatch

        return (
          <div
            id={`q-${q.number}`}
            className={cn(
              "rounded-md border p-4 transition-colors scroll-mt-20",
              disabled
                ? "border-slate-100 bg-slate-50 opacity-50 pointer-events-none"
                : isNo
                  ? "border-red-300 bg-red-50 border-l-4 border-l-red-600"
                  : isMissing
                    ? "border-red-400 bg-red-50 ring-2 ring-red-300"
                    : "border-slate-200 bg-white",
            )}
            aria-disabled={disabled}
            aria-label={partsToString(q.parts)}
          >
            {/* Question number + text */}
            <p className="text-sm text-slate-800 leading-relaxed mb-1">
              <span
                className={cn(
                  "font-semibold mr-1",
                  isNo ? "text-red-700" : "text-slate-700",
                )}
              >
                Q{q.number}.
              </span>
              <QuestionText parts={q.parts} />
            </p>

            {/* Bullets */}
            {q.bullets && q.bullets.length > 0 && (
              <ul className="ml-6 mt-1 mb-2 list-disc space-y-0.5">
                {q.bullets.map((b, i) => (
                  <li key={i} className="text-xs text-slate-600">
                    {b}
                  </li>
                ))}
              </ul>
            )}

            {/* Greyout note */}
            {disabled && (
              <p className="text-xs text-slate-400 italic mt-1">
                Not applicable based on engagement profile
              </p>
            )}

            {/* Answer buttons */}
            {!disabled && (
              <div
                className="mt-3 flex flex-wrap gap-2"
                role="group"
                aria-label={`Answer for Q${q.number}`}
              >
                <AnswerButton
                  answerVariant={value === "yes" ? "yes" : "idle"}
                  onClick={() => field.onChange("yes")}
                  aria-pressed={value === "yes"}
                >
                  Yes
                </AnswerButton>
                <AnswerButton
                  answerVariant={value === "no" ? "no" : "idle"}
                  onClick={() => field.onChange("no")}
                  aria-pressed={value === "no"}
                >
                  No
                </AnswerButton>
                {q.allowsNA && (
                  <AnswerButton
                    answerVariant={value === "na" ? "na" : "idle"}
                    onClick={() => field.onChange("na")}
                    aria-pressed={value === "na"}
                  >
                    N/A
                  </AnswerButton>
                )}

                {isMissing && (
                  <span className="ml-1 text-xs text-red-600 self-center" role="alert">
                    Required
                  </span>
                )}
              </div>
            )}

            {/* Note toggle (force-open when No selected) */}
            {!disabled && (
              <NoteToggle qId={q.id} forceOpen={isNo} />
            )}
          </div>
        );
      }}
    />
  );
}

export const QuestionRow = memo(QuestionRowInner);
