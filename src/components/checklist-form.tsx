"use client";

import { useState, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sections } from "@/lib/checklist/data";
import { submissionSchema, getMissingQuestionIds } from "@/lib/checklist/schema";
import type { SubmissionInput } from "@/lib/checklist/schema";
import { DEFAULT_RECIPIENT_EMAIL } from "@/lib/engagement";
import { submitChecklist } from "@/server/submit-checklist";
import { PreparerBlock } from "./preparer-block";
import { QuestionRow } from "./question-row";
import { MissingBanner } from "./missing-banner";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ReportType = "" | "written" | "oral";

const ORAL_SECTION_TITLE = "Oral Valuations Conclusions";

type FormState = "idle" | "validating" | "submitting" | "success" | "error";

function buildDefaultValues(): SubmissionInput {
  const answers: Record<string, { value: string; note: string }> = {};
  for (const section of sections) {
    for (const q of section.questions) {
      answers[q.id] = { value: "", note: "" };
    }
  }
  return {
    preparer: {
      name: "",
      completionDate: new Date(),
      valuationDate: new Date(),
      reviewerName: "",
      engagementName: "",
      recipientEmail: DEFAULT_RECIPIENT_EMAIL,
    },
    answers: answers as SubmissionInput["answers"],
  };
}

export function ChecklistForm() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [missingIds, setMissingIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successEngagement, setSuccessEngagement] = useState<string>("");
  const [reportType, setReportType] = useState<ReportType>("");
  const bannerRef = useRef<HTMLDivElement>(null);

  const methods = useForm<SubmissionInput>({
    resolver: zodResolver(submissionSchema),
    defaultValues: buildDefaultValues(),
    mode: "onSubmit",
  });

  const { handleSubmit, getValues, setValue, resetField, formState: { isSubmitting } } = methods;

  function handleReportTypeChange(value: ReportType) {
    setReportType(value);
    if (value === "written") {
      // Auto-fill oral section questions with N/A so validation passes
      setValue("answers.q5.value", "na");
      setValue("answers.q6.value", "na");
      setValue("answers.q7.value", "na");
      setValue("answers.q8.value", "na");
    } else {
      // Clear back to defaults so user must answer them for Oral reports
      resetField("answers.q5");
      resetField("answers.q6");
      resetField("answers.q7");
      resetField("answers.q8");
    }
  }

  async function onSubmit(data: SubmissionInput) {
    setFormState("submitting");
    setMissingIds([]);
    setErrorMessage("");

    try {
      const result = await submitChecklist(data);
      if (result.ok) {
        setFormState("success");
        setSuccessEngagement(data.preparer.engagementName);
      } else {
        setFormState("error");
        setErrorMessage(result.error);
      }
    } catch {
      setFormState("error");
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  }

  function onInvalid() {
    // Collect missing answer IDs (questions with no answer selected)
    const values = getValues();
    const missing = getMissingQuestionIds(
      values.answers as Partial<Record<string, { value?: string }>>,
    );
    setMissingIds(missing);

    // Scroll to banner then to first missed question
    setTimeout(() => {
      bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (missing.length > 0) {
        const firstNum = parseInt(missing[0]!.replace("q", ""), 10);
        setTimeout(() => {
          const el = document.getElementById(`q-${firstNum}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            const firstRadio = el.querySelector<HTMLButtonElement>('button[role="radio"]');
            firstRadio?.focus();
          }
        }, 300);
      }
    }, 100);
  }

  if (formState === "success") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 mb-4" />
        <h2 className="text-xl font-semibold text-green-900 mb-2">Checklist Submitted!</h2>
        <p className="text-green-700">
          The completed CBV Practice Inspection Checklist for{" "}
          <strong>{successEngagement}</strong> has been emailed successfully.
        </p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={() => {
            setFormState("idle");
            setMissingIds([]);
            setErrorMessage("");
            methods.reset(buildDefaultValues());
          }}
        >
          Submit Another Checklist
        </Button>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
        <div ref={bannerRef}>
          {missingIds.length > 0 && <MissingBanner missingIds={missingIds} />}
          {formState === "error" && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Submission Failed</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        <PreparerBlock />

        {/* Report type selector */}
        <div className="rounded-lg border bg-slate-50 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Label htmlFor="report-type" className="text-sm font-semibold text-slate-900 whitespace-nowrap">
              Are you completing a{" "}
              <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <select
              id="report-type"
              value={reportType}
              onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
              className="flex h-9 w-full sm:w-48 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-required="true"
            >
              <option value="">Select type…</option>
              <option value="written">Written</option>
              <option value="oral">Oral</option>
            </select>
            <span className="text-sm text-slate-600">report?</span>
          </div>
        </div>

        {sections.map((section) => {
          const isOralSection = section.title === ORAL_SECTION_TITLE;
          const isGreyedOut = isOralSection && reportType === "written";

          return (
            <section
              key={section.title}
              aria-labelledby={`section-${section.title.slice(0, 20).replace(/\s/g, "-")}`}
              className={cn("mb-8", isGreyedOut && "opacity-40 pointer-events-none select-none")}
              inert={isGreyedOut || undefined}
            >
              <h2
                id={`section-${section.title.slice(0, 20).replace(/\s/g, "-")}`}
                className="text-sm font-bold text-white bg-[#1e3a5f] px-4 py-2 rounded-t-md mb-0 uppercase tracking-wide"
              >
                {section.title}
              </h2>
              <div className="space-y-3 mt-2">
                {section.questions.map((q) => (
                  <QuestionRow
                    key={q.id}
                    question={q}
                    isMissing={!isGreyedOut && missingIds.includes(q.id)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* Submit button */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 py-4 px-0 -mx-4 px-4 mt-8">
          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 text-white"
            disabled={isSubmitting || formState === "submitting"}
          >
            {(isSubmitting || formState === "submitting") ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "COMPLETE"
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
