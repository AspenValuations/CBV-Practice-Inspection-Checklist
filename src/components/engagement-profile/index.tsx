"use client";

import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { GateQuestion } from "./gate-question";
import { computeInactiveSet, conclusionTypeOptions } from "@/lib/checklist/gates";
import type { SubmissionInput } from "@/lib/checklist/schema";
import type { Gates } from "@/lib/checklist/types";

export function EngagementProfile() {
  const { control, setValue } = useFormContext<SubmissionInput>();
  const gates = useWatch({ control, name: "gates" }) as Gates;
  const g2Standards = gates?.g2Standards ?? null;

  // When G2 switches to IVS, auto-select the single IVS conclusion type.
  useEffect(() => {
    if (g2Standards === "ivs") {
      setValue("gates.g3ConclusionType", "ivs_standard", { shouldDirty: false });
    } else {
      // Clear G3 when switching back to CBV/null so the user must re-pick.
      setValue("gates.g3ConclusionType", null, { shouldDirty: false });
    }
  }, [g2Standards, setValue]);

  // Clear answers for questions that just became inactive due to gate changes.
  useEffect(() => {
    if (!gates) return;
    const inactive = computeInactiveSet(gates);
    inactive.forEach((id) => {
      setValue(`answers.${id}.value` as "answers.q1.value", undefined as unknown as string, {
        shouldDirty: false,
      });
      setValue(`answers.${id}.note` as "answers.q1.note", "", { shouldDirty: false });
    });
  }, [gates, setValue]);

  const g3Options = conclusionTypeOptions(g2Standards);
  const isIvs = g2Standards === "ivs";

  return (
    <section id="engagement-profile" className="mb-8" aria-labelledby="engagement-profile-heading">
      <h2
        id="engagement-profile-heading"
        className="text-sm font-bold text-white bg-[#1A322F] px-4 py-2 rounded-t-md uppercase tracking-wide"
      >
        Engagement Profile
      </h2>
      <div className="border border-t-0 border-slate-200 rounded-b-md p-6 space-y-6 bg-white">
        <p className="text-xs text-slate-500 -mt-2">
          Answer the 6 gate questions below. These determine which checklist questions apply to this
          engagement.
        </p>

        <GateQuestion
          name="gates.g1Oral"
          label="G1. Is this an oral valuation conclusion engagement?"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          noteOnValue="no"
          note="Q5–Q8 are not applicable and will be excluded (oral report requirements do not apply)."
        />

        <GateQuestion
          name="gates.g2Standards"
          label="G2. Which valuation standards apply to this engagement?"
          options={[
            { value: "cbv", label: "CBV Practice Standards" },
            { value: "ivs", label: "IVS Standards" },
          ]}
          noteOnValue="ivs"
          note="IVS selected — Gate 3 is auto-set to IVS Standard Report."
        />

        <GateQuestion
          name="gates.g3ConclusionType"
          label="G3. What is the conclusion type?"
          options={g3Options}
          disabled={isIvs}
          note={isIvs ? undefined : undefined}
        />

        <GateQuestion
          name="gates.g4ScopeLimitations"
          label="G4. Are there scope limitations in this engagement?"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          noteOnValue="no"
          note="Q42–Q43 are not applicable and will be excluded (no scope limitations)."
        />

        <GateQuestion
          name="gates.g5EngagementLetter"
          label="G5. Has a signed engagement letter been obtained?"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          noteOnValue="no"
          note="No signed engagement letter — this will appear as a flag in the submission review."
        />

        <GateQuestion
          name="gates.g6RepLetter"
          label="G6. Has a representation letter been obtained?"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no_internal_docs", label: "No, but internal documentation exists" },
          ]}
          noteOnValue="no_internal_docs"
          note="Q69 and Q86 are not applicable and will be excluded (no rep letter; internal documentation used instead)."
        />
      </div>
    </section>
  );
}
