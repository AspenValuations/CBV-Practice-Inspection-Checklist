import * as React from "react";
import { cn } from "@/lib/utils";

interface InlineNoteProps {
  children: React.ReactNode;
  className?: string;
}

export function InlineNote({ children, className }: InlineNoteProps) {
  return (
    <div
      className={cn(
        "mt-2 px-3 py-2 rounded text-xs text-[#0a3a40] bg-[#e6f8fb] border-l-4 border-[#05B4C9]",
        className,
      )}
      role="note"
    >
      {children}
    </div>
  );
}
