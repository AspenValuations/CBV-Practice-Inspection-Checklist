"use client";

import { useFormContext, Controller } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ChecklistQuestion } from "@/lib/checklist/types";
import type { SubmissionInput } from "@/lib/checklist/schema";

interface QuestionRowProps {
  question: ChecklistQuestion;
  isMissing: boolean;
}

const RADIO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "na", label: "N/A" },
] as const;

export function QuestionRow({ question, isMissing }: QuestionRowProps) {
  const { control, register } = useFormContext<SubmissionInput>();
  const options = question.allowsNA ? RADIO_OPTIONS : RADIO_OPTIONS.slice(0, 2);
  const fieldId = question.id as `q${number}`;
  const answerPath = `answers.${fieldId}.value` as const;
  const notePath = `answers.${fieldId}.note` as const;

  return (
    <div
      id={`q-${question.number}`}
      className={cn(
        "rounded-md border p-4 transition-colors",
        isMissing
          ? "border-red-400 bg-red-50 ring-2 ring-red-300"
          : "border-slate-200 bg-white",
      )}
    >
      {/* Question text */}
      <p className="text-sm text-slate-800 leading-relaxed mb-1">
        <span className="font-semibold mr-1">Q{question.number}.</span>
        {question.text}
      </p>

      {/* Bullets if any */}
      {question.bullets && question.bullets.length > 0 && (
        <ul className="ml-6 mt-1 mb-2 list-disc space-y-0.5">
          {question.bullets.map((b, i) => (
            <li key={i} className="text-xs text-slate-600">
              {b}
            </li>
          ))}
        </ul>
      )}

      {/* Radio group */}
      <div className="mt-3">
        <Controller
          name={answerPath as "answers.q1.value"}
          control={control}
          render={({ field }) => (
            <RadioGroup
              value={field.value ?? ""}
              onValueChange={field.onChange}
              className="flex flex-row gap-4"
              aria-label={`Question ${question.number} answer`}
              aria-required="true"
            >
              {options.map((opt) => (
                <div key={opt.value} className="flex items-center gap-1.5">
                  <RadioGroupItem
                    value={opt.value}
                    id={`${question.id}-${opt.value}`}
                    className={isMissing ? "border-red-400" : ""}
                  />
                  <Label
                    htmlFor={`${question.id}-${opt.value}`}
                    className={cn(
                      "cursor-pointer text-sm",
                      opt.value === "no" && field.value === "no"
                        ? "text-red-700 font-semibold"
                        : "",
                    )}
                  >
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        />
        {isMissing && (
          <p className="text-xs text-red-600 mt-1" role="alert">
            This question requires an answer
          </p>
        )}
      </div>

      {/* Note textarea */}
      <div className="mt-3">
        <Label htmlFor={`${question.id}-note`} className="text-xs text-slate-500">
          Note (optional)
        </Label>
        <Textarea
          id={`${question.id}-note`}
          placeholder="Add a note..."
          className="mt-1 text-sm min-h-[60px] resize-y"
          {...register(notePath as "answers.q1.note")}
        />
      </div>
    </div>
  );
}
