"use client";

import { cn } from "@/lib/utils";
import { SectionBadge } from "./section-badge";
import type { SectionTally } from "@/lib/checklist/tally";

interface SectionLinkProps {
  id: string;
  label: string;
  active: boolean;
  stats: Pick<SectionTally, "no" | "unanswered" | "totalActive">;
}

export function SectionLink({ id, label, active, stats }: SectionLinkProps) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    // Focus the heading inside the section for SR announcement
    const heading = target.querySelector<HTMLElement>("h2[tabindex]");
    if (heading) {
      setTimeout(() => heading.focus({ preventScroll: true }), 400);
    }
  }

  return (
    <li>
      <a
        href={`#${id}`}
        onClick={handleClick}
        aria-current={active ? "location" : undefined}
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-md transition-colors hover:bg-slate-100",
          active
            ? "bg-[#e6f8fb] text-[#05B4C9] font-semibold border-l-2 border-[#05B4C9]"
            : "text-slate-600",
        )}
      >
        <span className="truncate">{label}</span>
        <SectionBadge stats={stats} compact />
      </a>
    </li>
  );
}
