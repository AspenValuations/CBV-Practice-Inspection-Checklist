"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const answerButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 border cursor-pointer select-none",
  {
    variants: {
      answerVariant: {
        idle: "bg-white border-slate-300 text-slate-700 hover:bg-slate-50",
        yes: "bg-[#05B4C9] border-[#05B4C9] text-white hover:bg-[#049ab0]",
        no: "bg-red-600 border-red-600 text-white hover:bg-red-700",
        na: "bg-[#3a3a3a] border-[#3a3a3a] text-white hover:bg-[#2d2d2d]",
      },
    },
    defaultVariants: { answerVariant: "idle" },
  },
);

export interface AnswerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof answerButtonVariants> {}

export const AnswerButton = React.forwardRef<HTMLButtonElement, AnswerButtonProps>(
  ({ className, answerVariant, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(answerButtonVariants({ answerVariant }), className)}
      {...props}
    />
  ),
);
AnswerButton.displayName = "AnswerButton";
