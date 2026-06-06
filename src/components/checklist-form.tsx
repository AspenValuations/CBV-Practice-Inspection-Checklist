"use client";

import { useState, useMemo } from "react";
import { useForm, FormProvider, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { sections } from "@/lib/checklist/data";
import { DEFAULT_ANSWERS } from "@/lib/checklist/defaults";
import { submissionSchema } from "@/lib/checklist/schema";
import type { SubmissionInput } from "@/lib/checklist/schema";
import { DEFAULT_RECIPIENT_EMAIL } from "@/lib/engagement";
import { computeInactiveSet } from "@/lib/checklist/gates";
import { submitChecklist } from "@/server/submit-checklist";
import { PreparerBlock } from "./preparer-block";
import { QuestionRow } from "./question-row/index";
import { EngagementProfile } from "./engagement-profile";
import { Sidebar } from "./sidebar";
import { ReviewModal } from "./review-modal";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import type { Gates } from "@/lib/checklist/types";

// PS group IDs: the first section in each group gets the group anchor ID
const PS_GROUP_ANCHORS: Record<number, string> = {
  0: "ps-100",
  3: "ps-110",
  10: "ps-120",
  11: "ps-130",
};

function buildDefaultValues(): SubmissionInput {
  const answers: Record<string, { value: string; note: string }> = {};
  for (const section of sections) {
    for (const q of section.questions) {
      const d = DEFAULT_ANSWERS[q.id];
      answers[q.id] = { value: d?.value ?? "", note: d?.note ?? "" };
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
    gates: {
      g1Oral: null,
      g2Standards: null,
      g3ConclusionType: null,
      g4ScopeLimitations: null,
      g5EngagementLetter: null,
      g6RepLetter: null,
    },
    answers: answers as SubmissionInput["answers"],
  };
}

export function ChecklistForm() {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successEngagement, setSuccessEngagement] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const methods = useForm<SubmissionInput>({
    resolver: zodResolver(submissionSchema) as Resolver<SubmissionInput>,
    defaultValues: buildDefaultValues(),
    mode: "onSubmit",
  });

  const { handleSubmit, control, formState: { isSubmitting } } = methods;
  const gates = useWatch({ control, name: "gates" }) as Gates;
  const inactive = useMemo(() => computeInactiveSet(gates ?? null), [gates]);

  async function onSubmit(data: SubmissionInput) {
    setErrorMessage("");
    try {
      const result = await submitChecklist(data);
      if (result.ok) {
        setReviewOpen(false);
        setSuccessEngagement(data.preparer.engagementName);
        setSubmitted(true);
        toast.success(`Checklist sent to ${result.recipientEmail}`);
      } else {
        setErrorMessage(result.error);
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  }

  if (submitted) {
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
            setSubmitted(false);
            setSuccessEngagement("");
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
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Submission Failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 lg:items-start">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content */}
          <div>
            <div id="engagement-details">
              <PreparerBlock />
            </div>

            <EngagementProfile />

            {sections.map((section, idx) => {
              const sectionId = `section-${section.title.slice(0, 20).replace(/\s/g, "-")}`;
              const anchorId = PS_GROUP_ANCHORS[idx];
              return (
                <section
                  key={section.title}
                  aria-labelledby={sectionId}
                  className="mb-8"
                  {...(anchorId ? { id: anchorId } : {})}
                >
                  <h2
                    id={sectionId}
                    tabIndex={-1}
                    className="text-sm font-bold text-white bg-[#1A322F] px-4 py-2 rounded-t-md mb-0 uppercase tracking-wide scroll-mt-16"
                  >
                    {section.title}
                  </h2>
                  <div className="space-y-3 mt-2">
                    {section.questions.map((q) => (
                      <QuestionRow
                        key={q.id}
                        question={q}
                        isMissing={false}
                        disabled={inactive.has(q.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Review & Submit button */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 py-4 mt-8">
              <Button
                type="button"
                size="lg"
                className="w-full sm:w-auto bg-[#1A322F] hover:bg-[#1A322F]/90 text-white"
                onClick={() => setReviewOpen(true)}
              >
                Review &amp; Submit
              </Button>
            </div>
          </div>
        </div>

        <ReviewModal
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          onConfirmSubmit={() => handleSubmit(onSubmit)()}
          isSubmitting={isSubmitting}
        />
      </form>
    </FormProvider>
  );
}
