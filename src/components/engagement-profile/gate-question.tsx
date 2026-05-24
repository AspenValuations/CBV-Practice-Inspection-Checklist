"use client";

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { Controller, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { AnswerButton } from "./answer-button";
import { InlineNote } from "./inline-note";
import type { SubmissionInput } from "@/lib/checklist/schema";
import type { VariantProps } from "class-variance-authority";
import type { answerButtonVariants } from "./answer-button";

interface GateOption {
  value: string;
  label: string;
}

interface GateQuestionProps {
  name: `gates.${string}`;
  label: string;
  options: GateOption[];
  note?: string;
  noteOnValue?: string;
  disabled?: boolean;
}

function optionVariant(
  optValue: string,
  selected: boolean,
): VariantProps<typeof answerButtonVariants>["answerVariant"] {
  if (!selected) return "idle";
  if (optValue === "no" || optValue === "no_internal_docs") return "no";
  return "yes";
}

export function GateQuestion({
  name,
  label,
  options,
  note,
  noteOnValue,
  disabled = false,
}: GateQuestionProps) {
  const { control } = useFormContext<SubmissionInput>();

  return (
    <div className={cn("space-y-1.5", disabled && "opacity-50 pointer-events-none")}>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <Controller
        name={name as "gates.g1Oral"}
        control={control}
        render={({ field }) => {
          const currentValue = (field.value ?? "") as string;
          const showNote =
            note &&
            (noteOnValue
              ? currentValue === noteOnValue
              : currentValue !== "" && currentValue !== null);

          return (
            <>
              <ToggleGroupPrimitive.Root
                type="single"
                value={currentValue}
                onValueChange={(val) => field.onChange(val || null)}
                className="flex flex-wrap gap-2"
                aria-label={label}
                disabled={disabled}
              >
                {options.map((opt) => {
                  const isSelected = currentValue === opt.value;
                  return (
                    <ToggleGroupPrimitive.Item
                      key={opt.value}
                      value={opt.value}
                      disabled={disabled}
                      asChild
                    >
                      <AnswerButton answerVariant={optionVariant(opt.value, isSelected)}>
                        {opt.label}
                      </AnswerButton>
                    </ToggleGroupPrimitive.Item>
                  );
                })}
              </ToggleGroupPrimitive.Root>
              {showNote && <InlineNote>{note}</InlineNote>}
            </>
          );
        }}
      />
    </div>
  );
}
