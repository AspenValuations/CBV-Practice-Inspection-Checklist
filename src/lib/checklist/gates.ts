import type { ConclusionType, Gates } from "./types";

interface GateRule {
  field: keyof Gates;
  triggerValue: string;
  greyedIds: string[];
  reason: string; // surfaced in email Part 2 exclusion blocks
}

// Declarative map of gate conditions → greyed question IDs.
// Note: g2Standards "cbv" has empty greyedIds because Q10/Q11 (IVS) don't
// exist in data.ts (IVS section intentionally excluded). The rule is kept
// for symmetry and future reference only.
const GATE_RULES: GateRule[] = [
  {
    field: "g1Oral",
    triggerValue: "no",
    greyedIds: ["q5", "q6", "q7", "q8"],
    reason: "Oral valuation conclusions — not an oral conclusion engagement",
  },
  {
    field: "g2Standards",
    triggerValue: "cbv",
    greyedIds: [], // Q10/Q11 absent from dataset
    reason: "IVS compliance — CBV 110/120/130 standards selected",
  },
  {
    field: "g4ScopeLimitations",
    triggerValue: "no",
    greyedIds: ["q42", "q43"],
    reason: "Scope limitations — no scope limitations in this engagement",
  },
  {
    field: "g6RepLetter",
    triggerValue: "no_internal_docs",
    greyedIds: ["q69", "q86"],
    reason: "Rep letter branch — no rep letter but internal documentation exists",
  },
];

export const DEFAULT_GATES: Gates = {
  g1Oral: null,
  g2Standards: null,
  g3ConclusionType: null,
  g4ScopeLimitations: null,
  g5EngagementLetter: null,
  g6RepLetter: null,
};

// Derives the set of inactive (greyed-out) question IDs from gate answers.
// Returns empty set if gates is null or no rules are triggered.
export function computeInactiveSet(gates: Gates | null): Set<string> {
  if (!gates) return new Set();
  const inactive = new Set<string>();
  for (const rule of GATE_RULES) {
    const val = gates[rule.field];
    if (val === rule.triggerValue) {
      for (const id of rule.greyedIds) {
        inactive.add(id);
      }
    }
  }
  return inactive;
}

// Returns the human-readable reason a question is greyed out (for email Part 2).
// Returns null if the question is active.
export function inactiveReason(qId: string, gates: Gates | null): string | null {
  if (!gates) return null;
  for (const rule of GATE_RULES) {
    const val = gates[rule.field];
    if (val === rule.triggerValue && rule.greyedIds.includes(qId)) {
      return rule.reason;
    }
  }
  return null;
}

// Returns all gate rules — used by email Part 2 to render exclusion blocks.
export function getGateRules(): readonly GateRule[] {
  return GATE_RULES;
}

// Returns the available options for Gate 3 (Conclusion Type) based on Gate 2 (Standards).
// IVS → single locked option; CBV or null → 3 CBV options.
export function conclusionTypeOptions(
  standards: Gates["g2Standards"],
): { value: ConclusionType; label: string }[] {
  if (standards === "ivs") {
    return [{ value: "ivs_standard", label: "IVS Standard Report" }];
  }
  return [
    { value: "comprehensive", label: "Comprehensive" },
    { value: "estimate", label: "Estimate" },
    { value: "calculation", label: "Calculation" },
  ];
}
