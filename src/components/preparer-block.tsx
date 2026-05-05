"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/date-picker";
import { DEFAULT_RECIPIENT_EMAIL } from "@/lib/engagement";
import type { SubmissionInput } from "@/lib/checklist/schema";

export function PreparerBlock() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<SubmissionInput>();

  return (
    <div className="rounded-lg border bg-slate-50 p-6 mb-8">
      <h2 className="text-base font-semibold text-slate-900 mb-4 uppercase tracking-wide">
        Preparer Information
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Name */}
        <div className="space-y-1">
          <Label htmlFor="preparer-name">
            Preparer&apos;s Name <span className="text-red-500">*</span>
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

        {/* Date */}
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
