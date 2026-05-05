"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface MissingBannerProps {
  missingIds: string[]; // e.g. ["q1", "q14", "q42"]
}

function idToNumber(id: string): number {
  return parseInt(id.replace("q", ""), 10);
}

function scrollToQuestion(num: number) {
  const el = document.getElementById(`q-${num}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const firstRadio = el.querySelector<HTMLButtonElement>('button[role="radio"]');
    firstRadio?.focus();
  }
}

export function MissingBanner({ missingIds }: MissingBannerProps) {
  const numbers = missingIds.map(idToNumber).sort((a, b) => a - b);

  return (
    <div role="alert" aria-live="assertive" className="mb-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Incomplete Checklist</AlertTitle>
        <AlertDescription>
          <p className="mb-2">
            {numbers.length === 1
              ? "1 question requires an answer:"
              : `${numbers.length} questions require answers:`}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {numbers.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => scrollToQuestion(num)}
                className="inline-flex items-center rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                Q{num}
              </button>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
