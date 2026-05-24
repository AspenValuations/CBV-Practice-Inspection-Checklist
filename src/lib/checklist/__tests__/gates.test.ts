import { describe, it, expect } from "vitest";
import {
  computeInactiveSet,
  inactiveReason,
  DEFAULT_GATES,
} from "../gates";
import type { Gates } from "../types";

const allNull: Gates = { ...DEFAULT_GATES };

describe("computeInactiveSet", () => {
  it("returns empty set when gates is null", () => {
    expect(computeInactiveSet(null).size).toBe(0);
  });

  it("returns empty set when all gates are null (DEFAULT_GATES)", () => {
    expect(computeInactiveSet(allNull).size).toBe(0);
  });

  it("G1 oral=no greys q5, q6, q7, q8", () => {
    const gates: Gates = { ...allNull, g1Oral: "no" };
    const inactive = computeInactiveSet(gates);
    expect(inactive.has("q5")).toBe(true);
    expect(inactive.has("q6")).toBe(true);
    expect(inactive.has("q7")).toBe(true);
    expect(inactive.has("q8")).toBe(true);
    expect(inactive.size).toBe(4);
  });

  it("G1 oral=yes greys nothing", () => {
    const gates: Gates = { ...allNull, g1Oral: "yes" };
    expect(computeInactiveSet(gates).size).toBe(0);
  });

  it("G2 cbv greys nothing (Q10/Q11 absent from dataset)", () => {
    const gates: Gates = { ...allNull, g2Standards: "cbv" };
    expect(computeInactiveSet(gates).size).toBe(0);
  });

  it("G2 ivs greys nothing either", () => {
    const gates: Gates = { ...allNull, g2Standards: "ivs" };
    expect(computeInactiveSet(gates).size).toBe(0);
  });

  it("G4 scopeLimitations=no greys q42, q43", () => {
    const gates: Gates = { ...allNull, g4ScopeLimitations: "no" };
    const inactive = computeInactiveSet(gates);
    expect(inactive.has("q42")).toBe(true);
    expect(inactive.has("q43")).toBe(true);
    expect(inactive.size).toBe(2);
  });

  it("G4 scopeLimitations=yes greys nothing", () => {
    const gates: Gates = { ...allNull, g4ScopeLimitations: "yes" };
    expect(computeInactiveSet(gates).size).toBe(0);
  });

  it("G6 repLetter=no_internal_docs greys q69, q86", () => {
    const gates: Gates = { ...allNull, g6RepLetter: "no_internal_docs" };
    const inactive = computeInactiveSet(gates);
    expect(inactive.has("q69")).toBe(true);
    expect(inactive.has("q86")).toBe(true);
    expect(inactive.size).toBe(2);
  });

  it("G6 repLetter=yes greys nothing", () => {
    const gates: Gates = { ...allNull, g6RepLetter: "yes" };
    expect(computeInactiveSet(gates).size).toBe(0);
  });

  it("multiple gates combine correctly (G1=no + G4=no + G6=no_internal_docs)", () => {
    const gates: Gates = {
      ...allNull,
      g1Oral: "no",
      g4ScopeLimitations: "no",
      g6RepLetter: "no_internal_docs",
    };
    const inactive = computeInactiveSet(gates);
    // G1: q5-q8 (4), G4: q42-q43 (2), G6: q69+q86 (2)
    expect(inactive.size).toBe(8);
    for (const id of ["q5", "q6", "q7", "q8", "q42", "q43", "q69", "q86"]) {
      expect(inactive.has(id), `expected ${id} to be inactive`).toBe(true);
    }
  });

  it("G5 engagementLetter has no greyout effect", () => {
    const gatesYes: Gates = { ...allNull, g5EngagementLetter: "yes" };
    const gatesNo: Gates = { ...allNull, g5EngagementLetter: "no" };
    expect(computeInactiveSet(gatesYes).size).toBe(0);
    expect(computeInactiveSet(gatesNo).size).toBe(0);
  });

  it("G3 conclusionType has no greyout effect", () => {
    const gates: Gates = { ...allNull, g3ConclusionType: "comprehensive" };
    expect(computeInactiveSet(gates).size).toBe(0);
  });
});

describe("inactiveReason", () => {
  it("returns null when gates is null", () => {
    expect(inactiveReason("q5", null)).toBeNull();
  });

  it("returns null for active question", () => {
    const gates: Gates = { ...allNull, g1Oral: "no" };
    expect(inactiveReason("q1", gates)).toBeNull();
  });

  it("returns reason string for greyed question", () => {
    const gates: Gates = { ...allNull, g1Oral: "no" };
    const reason = inactiveReason("q5", gates);
    expect(reason).toBeTruthy();
    expect(reason).toContain("oral");
  });

  it("returns reason for G4 greyed question", () => {
    const gates: Gates = { ...allNull, g4ScopeLimitations: "no" };
    const reason = inactiveReason("q42", gates);
    expect(reason).toBeTruthy();
    expect(reason?.toLowerCase()).toContain("scope");
  });

  it("returns reason for G6 greyed question", () => {
    const gates: Gates = { ...allNull, g6RepLetter: "no_internal_docs" };
    const reason = inactiveReason("q69", gates);
    expect(reason).toBeTruthy();
    expect(reason?.toLowerCase()).toContain("rep letter");
  });
});
