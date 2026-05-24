import { describe, it, expect } from "vitest";
import { buildBlocks } from "../blocks";
import type { ChecklistSection, Gates } from "@/lib/checklist/types";
import { DEFAULT_GATES } from "@/lib/checklist/gates";

function makeSection(qs: { id: string; number: number; allowsNA?: boolean }[]): ChecklistSection {
  return {
    title: "Test Section",
    questions: qs.map((q) => ({
      id: q.id,
      number: q.number,
      allowsNA: q.allowsNA ?? false,
      parts: [{ text: `Question ${q.number}` }],
    })),
  };
}

const NO_INACTIVE = new Set<string>();
const NO_GATES: Gates = { ...DEFAULT_GATES };

describe("buildBlocks", () => {
  it("all-yes section → single run block", () => {
    const section = makeSection([
      { id: "q1", number: 1 },
      { id: "q2", number: 2 },
      { id: "q3", number: 3 },
    ]);
    const answers = { q1: { value: "yes" }, q2: { value: "yes" }, q3: { value: "yes" } };
    const [sb] = buildBlocks([section], answers, NO_GATES, NO_INACTIVE);
    expect(sb!.blocks).toHaveLength(1);
    expect(sb!.blocks[0]).toMatchObject({ kind: "run", label: "Yes", fromQ: 1, toQ: 3, count: 3 });
  });

  it("one No mid-section → run, no, run", () => {
    const section = makeSection([
      { id: "q1", number: 1 },
      { id: "q2", number: 2 },
      { id: "q3", number: 3 },
    ]);
    const answers = { q1: { value: "yes" }, q2: { value: "no" }, q3: { value: "yes" } };
    const [sb] = buildBlocks([section], answers, NO_GATES, NO_INACTIVE);
    expect(sb!.blocks).toHaveLength(3);
    expect(sb!.blocks[0]).toMatchObject({ kind: "run", label: "Yes", fromQ: 1, toQ: 1, count: 1 });
    expect(sb!.blocks[1]).toMatchObject({ kind: "no", qNumber: 2 });
    expect(sb!.blocks[2]).toMatchObject({ kind: "run", label: "Yes", fromQ: 3, toQ: 3, count: 1 });
  });

  it("Yes then N/A then Yes → three separate run blocks", () => {
    const section = makeSection([
      { id: "q1", number: 1, allowsNA: false },
      { id: "q2", number: 2, allowsNA: true },
      { id: "q3", number: 3, allowsNA: false },
    ]);
    const answers = { q1: { value: "yes" }, q2: { value: "na" }, q3: { value: "yes" } };
    const [sb] = buildBlocks([section], answers, NO_GATES, NO_INACTIVE);
    expect(sb!.blocks).toHaveLength(3);
    expect(sb!.blocks[0]).toMatchObject({ kind: "run", label: "Yes" });
    expect(sb!.blocks[1]).toMatchObject({ kind: "run", label: "N/A" });
    expect(sb!.blocks[2]).toMatchObject({ kind: "run", label: "Yes" });
  });

  it("4 consecutive greyed Qs sharing same reason → 1 exclusion block", () => {
    const section = makeSection([
      { id: "q1", number: 1 },
      { id: "q5", number: 5 },
      { id: "q6", number: 6 },
      { id: "q7", number: 7 },
      { id: "q8", number: 8 },
      { id: "q9", number: 9 },
    ]);
    // g1Oral="no" greys q5–q8
    const gates: Gates = { ...DEFAULT_GATES, g1Oral: "no" };
    const inactive = new Set(["q5", "q6", "q7", "q8"]);
    const answers = {
      q1: { value: "yes" },
      q5: { value: "yes" },
      q6: { value: "yes" },
      q7: { value: "yes" },
      q8: { value: "yes" },
      q9: { value: "yes" },
    };
    const [sb] = buildBlocks([section], answers, gates, inactive);
    const exclusions = sb!.blocks.filter((b) => b.kind === "exclusion");
    expect(exclusions).toHaveLength(1);
    const excl = exclusions[0] as { kind: "exclusion"; qNumbers: number[]; gateReason: string };
    expect(excl.qNumbers).toEqual([5, 6, 7, 8]);
    expect(excl.gateReason).toContain("Oral");
  });

  it("2 greyed Qs with different reasons → 2 exclusion blocks", () => {
    const section = makeSection([
      { id: "q5", number: 5 },   // greyed by g1Oral=no
      { id: "q42", number: 42 }, // greyed by g4ScopeLimitations=no
    ]);
    const gates: Gates = { ...DEFAULT_GATES, g1Oral: "no", g4ScopeLimitations: "no" };
    const inactive = new Set(["q5", "q42"]);
    const answers = { q5: { value: "yes" }, q42: { value: "yes" } };
    const [sb] = buildBlocks([section], answers, gates, inactive);
    const exclusions = sb!.blocks.filter((b) => b.kind === "exclusion");
    expect(exclusions).toHaveLength(2);
  });

  it("single-Q run has fromQ === toQ", () => {
    const section = makeSection([
      { id: "q1", number: 1 },
      { id: "q2", number: 2 },
    ]);
    const answers = { q1: { value: "no" }, q2: { value: "yes" } };
    const [sb] = buildBlocks([section], answers, NO_GATES, NO_INACTIVE);
    const run = sb!.blocks.find((b) => b.kind === "run") as { fromQ: number; toQ: number };
    expect(run.fromQ).toBe(2);
    expect(run.toQ).toBe(2);
  });

  it("no block carries note when present", () => {
    const section = makeSection([{ id: "q1", number: 1 }]);
    const answers = { q1: { value: "no", note: "Missing document" } };
    const [sb] = buildBlocks([section], answers, NO_GATES, NO_INACTIVE);
    const noBlock = sb!.blocks[0] as { kind: "no"; note?: string };
    expect(noBlock.note).toBe("Missing document");
  });
});
