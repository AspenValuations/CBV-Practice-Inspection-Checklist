"use client";

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { sections } from "@/lib/checklist/data";
import { computeInactiveSet } from "@/lib/checklist/gates";
import { tallyAll } from "@/lib/checklist/tally";
import { buildFlaggedItems } from "@/lib/checklist/flags";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Scorecard } from "./scorecard";
import { ConclusionBadge } from "./conclusion-badge";
import { StatusBanner } from "./status-banner";
import { FlaggedList } from "./flagged-list";
import type { SubmissionInput } from "@/lib/checklist/schema";
import type { Gates } from "@/lib/checklist/types";

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmSubmit: () => void;
  isSubmitting: boolean;
}

export function ReviewModal({ open, onOpenChange, onConfirmSubmit, isSubmitting }: ReviewModalProps) {
  const { getValues } = useFormContext<SubmissionInput>();

  const { tally, flags, gates } = useMemo(() => {
    if (!open) return { tally: { yes: 0, no: 0, na: 0, unanswered: 0, totalActive: 0 }, flags: [], gates: null };
    const values = getValues();
    const g = values.gates as Gates;
    const inactive = computeInactiveSet(g ?? null);
    const t = tallyAll(sections, values.answers as Record<string, { value?: string }>, inactive);
    const f = buildFlaggedItems(sections, values.answers as Record<string, { value?: string }>, g, inactive);
    return { tally: t, flags: f, gates: g };
  }, [open, getValues]);

  const canSubmit = tally.unanswered === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-[#1A322F]">
            Review Submission
            {flags.length > 0 && (
              <span className="ml-2 text-sm text-red-600 font-normal">
                ({flags.length} flagged)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          <Scorecard tally={tally} />
          <ConclusionBadge conclusionType={gates?.g3ConclusionType ?? null} />
          <StatusBanner flagCount={flags.length} />
          {flags.length > 0 && <FlaggedList flags={flags} />}

          {!canSubmit && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
              {tally.unanswered} question{tally.unanswered === 1 ? "" : "s"} still unanswered.
              Please complete all questions before submitting.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Continue Editing
          </Button>
          <Button
            className="bg-[#1A322F] hover:bg-[#1A322F]/90 text-white"
            onClick={onConfirmSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Checklist"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
