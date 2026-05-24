"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { sections } from "@/lib/checklist/data";
import { computeInactiveSet } from "@/lib/checklist/gates";
import { tallyAll } from "@/lib/checklist/tally";
import { ProgressBar } from "./progress-bar";
import { SectionLink } from "./section-link";
import type { SubmissionInput } from "@/lib/checklist/schema";
import type { Gates } from "@/lib/checklist/types";
import type { SectionTally } from "@/lib/checklist/tally";

interface NavGroup {
  id: string;
  label: string;
  sectionIndices: number[];
}

// Group 12 data.ts sections by their PS standard header
const NAV_GROUPS: NavGroup[] = [
  { id: "ps-100", label: "PS 100", sectionIndices: [0, 1, 2] },
  { id: "ps-110", label: "PS 110", sectionIndices: [3, 4, 5, 6, 7, 8, 9] },
  { id: "ps-120", label: "PS 120", sectionIndices: [10] },
  { id: "ps-130", label: "PS 130", sectionIndices: [11] },
];

const STATIC_LINKS: { id: string; label: string }[] = [
  { id: "engagement-details", label: "Engagement Details" },
  { id: "engagement-profile", label: "Engagement Profile" },
];

const EMPTY_TALLY: SectionTally = { yes: 0, no: 0, na: 0, unanswered: 0, totalActive: 0 };

export function Sidebar() {
  const { control } = useFormContext<SubmissionInput>();
  const answers = useWatch({ control, name: "answers" }) as Record<
    string,
    { value?: string } | undefined
  >;
  const gates = useWatch({ control, name: "gates" }) as Gates;
  const [activeId, setActiveId] = useState<string>("");

  const inactive = useMemo(() => computeInactiveSet(gates ?? null), [gates]);

  // Aggregate tally per nav group
  const groupTallies = useMemo(() => {
    return NAV_GROUPS.map((group) => {
      const groupSections = group.sectionIndices.map((i) => sections[i]!);
      return tallyAll(groupSections, answers ?? {}, inactive);
    });
  }, [answers, inactive]);

  const globalTally = useMemo(
    () => tallyAll(sections, answers ?? {}, inactive),
    [answers, inactive],
  );

  // IntersectionObserver scroll-spy
  const observedIds = useMemo(
    () => [...STATIC_LINKS.map((l) => l.id), ...NAV_GROUPS.map((g) => g.id)],
    [],
  );
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    observerRef.current?.disconnect();

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          // Pick the topmost visible section
          const topmost = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
          );
          setActiveId(topmost.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );

    observedIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });

    observerRef.current = obs;
    return () => obs.disconnect();
  }, [observedIds]);

  const answered = globalTally.yes + globalTally.no + globalTally.na;

  return (
    <nav
      aria-label="Checklist sections"
      className="hidden lg:flex flex-col sticky top-4 self-start h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <div className="px-3 pt-3 pb-2 border-b border-slate-200">
        <p className="text-xs font-bold text-[#1A322F] uppercase tracking-wide">Navigation</p>
      </div>

      <ProgressBar answered={answered} total={globalTally.totalActive} />

      <ol className="flex-1 py-2 space-y-0.5 px-2">
        {STATIC_LINKS.map((link) => (
          <SectionLink
            key={link.id}
            id={link.id}
            label={link.label}
            active={activeId === link.id}
            stats={EMPTY_TALLY}
          />
        ))}

        <li className="pt-2 pb-1 px-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Questionnaire
          </span>
        </li>

        {NAV_GROUPS.map((group, i) => (
          <SectionLink
            key={group.id}
            id={group.id}
            label={group.label}
            active={activeId === group.id}
            stats={groupTallies[i] ?? EMPTY_TALLY}
          />
        ))}
      </ol>

      <div className="px-3 py-2 border-t border-slate-200">
        <p className="text-[10px] text-slate-400">
          {inactive.size > 0 && `${inactive.size} questions excluded`}
        </p>
      </div>
    </nav>
  );
}
