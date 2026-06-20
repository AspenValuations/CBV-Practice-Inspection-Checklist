"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/date-picker";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { DEFAULT_RECIPIENT_EMAIL } from "@/lib/engagement";
import type { SubmissionInput } from "@/lib/checklist/schema";

function InfoTooltip({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="ml-1 inline-flex items-center text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
          aria-label="More information"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm text-slate-700" side="top" align="start">
        {text}
      </PopoverContent>
    </Popover>
  );
}

export function PreparerBlock() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<SubmissionInput>();

  return (
    <div className="rounded-lg border bg-slate-50 p-6 mb-8">
      <h2 className="text-base font-semibold text-slate-900 mb-4 uppercase tracking-wide">
        Basic Information
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Preparer's Name */}
        <div className="space-y-1">
          <Label htmlFor="preparer-name" className="inline-flex items-center">
            Preparer of Report <span className="text-red-500 ml-0.5">*</span>
            <InfoTooltip text="Analyst who prepared the valuation file (i.e. Schedules and Report)." />
          </Label>
          <Input
            id="preparer-name"
            placeholder="Full name"
            {...register("preparer.name")}
            aria-invalid={!!errors.preparer?.name}
            className={errors.preparer?.name ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.preparer?.name && (
            <p className="text-xs text-red-500">{errors.preparer.name.message}</p>
          )}
        </div>

        {/* Reviewer's Name */}
        <div className="space-y-1">
          <Label htmlFor="reviewer-name" className="inline-flex items-center">
            Reviewer&apos;s Name <span className="text-red-500 ml-0.5">*</span>
            <InfoTooltip text="Manager/partner who reviewed the valuation report before issuing." />
          </Label>
          <Input
            id="reviewer-name"
            placeholder="Full name"
            {...register("preparer.reviewerName")}
            aria-invalid={!!errors.preparer?.reviewerName}
            className={errors.preparer?.reviewerName ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.preparer?.reviewerName && (
            <p className="text-xs text-red-500">{errors.preparer.reviewerName.message}</p>
          )}
        </div>

        {/* Checklist Completion Date */}
        <div className="space-y-1">
          <Label htmlFor="preparer-date">
            Checklist Completion Date <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="preparer.completionDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value instanceof Date ? field.value : undefined}
                onChange={(date) => field.onChange(date)}
                placeholder="Select date"
              />
            )}
          />
          {errors.preparer?.completionDate && (
            <p className="text-xs text-red-500">Please select a date</p>
          )}
        </div>

        {/* Valuation Date */}
        <div className="space-y-1">
          <Label htmlFor="valuation-date">
            Valuation Date <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="preparer.valuationDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value instanceof Date ? field.value : undefined}
                onChange={(date) => field.onChange(date)}
                placeholder="Select date"
              />
            )}
          />
          {errors.preparer?.valuationDate && (
            <p className="text-xs text-red-500">Please select a date</p>
          )}
        </div>

        {/* Engagement Name */}
        <div className="space-y-1">
          <Label htmlFor="engagement-name">
            Engagement Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="engagement-name"
            placeholder="e.g., Acme Corp Valuation 2026"
            {...register("preparer.engagementName")}
            aria-invalid={!!errors.preparer?.engagementName}
            className={errors.preparer?.engagementName ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.preparer?.engagementName && (
            <p className="text-xs text-red-500">{errors.preparer.engagementName.message}</p>
          )}
        </div>

        {/* Recipient Email */}
        <div className="space-y-1">
          <Label htmlFor="recipient-email">
            Recipient Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="recipient-email"
            type="email"
            placeholder={DEFAULT_RECIPIENT_EMAIL}
            {...register("preparer.recipientEmail")}
            aria-invalid={!!errors.preparer?.recipientEmail}
            className={errors.preparer?.recipientEmail ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          <p className="text-xs text-slate-500">
            Default: {DEFAULT_RECIPIENT_EMAIL} — change only if needed
          </p>
          {errors.preparer?.recipientEmail && (
            <p className="text-xs text-red-500">{errors.preparer.recipientEmail.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
