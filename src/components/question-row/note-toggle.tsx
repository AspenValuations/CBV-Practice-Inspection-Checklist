"use client";

import { useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import type { SubmissionInput } from "@/lib/checklist/schema";

interface NoteToggleProps {
  qId: string;
  forceOpen: boolean;
}

export function NoteToggle({ qId, forceOpen }: NoteToggleProps) {
  const { register, watch } = useFormContext<SubmissionInput>();
  const notePath = `answers.${qId}.note` as "answers.q1.note";
  const existingNote = watch(notePath);
  const [open, setOpen] = useState(forceOpen || Boolean(existingNote));
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-open when forced (e.g. "No" answer selected)
  useEffect(() => {
    if (forceOpen && !open) {
      setOpen(true);
    }
  }, [forceOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus textarea when it opens
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-xs text-slate-400 hover:text-[#05B4C9] transition-colors"
        aria-label={`Add note for question ${qId}`}
      >
        + Note
      </button>
    );
  }

  const { ref: rhfRef, ...rest } = register(notePath, { maxLength: 5000 });

  return (
    <div className="mt-2">
      <Textarea
        {...rest}
        ref={(el) => {
          rhfRef(el);
          (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
        }}
        placeholder="Add a note..."
        className="text-xs min-h-[60px] resize-y"
        maxLength={5000}
        aria-label={`Note for question ${qId}`}
      />
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-1 text-xs text-slate-400 hover:text-slate-600"
      >
        − Hide note
      </button>
    </div>
  );
}
