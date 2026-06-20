"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Info, X, Plus } from "lucide-react";
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
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<SubmissionInput>();

  const recipientEmails = (watch("preparer.recipientEmails") ?? [DEFAULT_RECIPIENT_EMAIL]) as string[];

  const addEmail = () =>
    setValue("preparer.recipientEmails", [...recipientEmails, ""], { shouldValidate: false });

  const removeEmail = (i: number) => {
    if (recipientEmails.length <= 1) return;
    setValue("preparer.recipientEmails", recipientEmails.filter((_, j) => j !== i), { shouldValidate: true });
  };

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

        {/* Recipient Email(s) */}
        <div className="space-y-1 sm:col-span-2">
          <Label className="inline-flex items-center">
            Recipient Email{recipientEmails.length > 1 ? "s" : ""} <span className="text-red-500 ml-0.5">*</span>
          </Label>
          <div className="space-y-2">
            {recipientEmails.map((_, i) => {
              const key = `preparer.recipientEmails.${i}` as const;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const fieldReg = register(key as any);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const itemErr = (errors.preparer as any)?.recipientEmails?.[i];
              return (
                <div key={i} className="space-y-1">
                  <div className="flex gap-2 items-center">
                    <Input
                      type="email"
                      placeholder={i === 0 ? DEFAULT_RECIPIENT_EMAIL : "email@example.com"}
                      aria-invalid={!!itemErr}
                      className={`flex-1 ${itemErr ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      {...fieldReg}
                    />
                    {recipientEmails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmail(i)}
                        className="shrink-0 text-slate-400 hover:text-red-500 focus:outline-none"
                        aria-label="Remove email"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {itemErr && (
                    <p className="text-xs text-red-500">{itemErr.message ?? "Invalid email"}</p>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addEmail}
            className="inline-flex items-center text-xs text-slate-500 hover:text-slate-700 focus:outline-none mt-1"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add another email
          </button>
          <p className="text-xs text-slate-500">
            Checklist will be sent to all addresses above
          </p>
        </div>
      </div>
    </div>
  );
}
