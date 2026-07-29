/**
 * MeetMind Executive PDF Engine
 * Composition Rules v1.0
 *
 * All thresholds are centralized here. Composition Engine must not contain
 * unexplained layout constants.
 */

import { BLOCK_IDS, DENSITY } from "./composition-types.js";

export const COMPOSITION_RULES = Object.freeze({
  version: "1.0",

  page: Object.freeze({
    defaultCapacity: 100,
    minimumUsefulCapacity: 55,
    maximumCapacity: 160,
    maximumPages: 2,
  }),

  density: Object.freeze({
    compactThreshold: 0.78,
    denseThreshold: 0.93,
    massMultiplier: Object.freeze({
      [DENSITY.REGULAR]: 1,
      [DENSITY.COMPACT]: 0.84,
      [DENSITY.DENSE]: 0.72,
    }),
  }),

  dominance: Object.freeze({
    ratio: 1.55,
    minimumMass: 12,
    balancedTolerance: 0.30,
  }),

  sideBySide: Object.freeze({
    maxCombinedMass: 33,
    maxSingleMass: 20,
  }),

  blockBaseMass: Object.freeze({
    [BLOCK_IDS.HEADER]: 5,
    [BLOCK_IDS.MEETING_STATS]: 5,
    [BLOCK_IDS.EXECUTIVE_SUMMARY]: 10,
    [BLOCK_IDS.KEY_METRICS]: 7,
    [BLOCK_IDS.INSIGHTS]: 7,
    [BLOCK_IDS.DECISIONS]: 7,
    [BLOCK_IDS.RISKS]: 7,
    [BLOCK_IDS.TASKS]: 10,
    [BLOCK_IDS.ARCHITECTURE]: 10,
    [BLOCK_IDS.OWNERS]: 6,
    [BLOCK_IDS.FOOTER]: 3,
  }),

  measurement: Object.freeze({
    charsPerMassUnit: 180,
    itemMass: Object.freeze({
      [BLOCK_IDS.KEY_METRICS]: 1.5,
      [BLOCK_IDS.INSIGHTS]: 2.6,
      [BLOCK_IDS.DECISIONS]: 2.6,
      [BLOCK_IDS.RISKS]: 2.8,
      [BLOCK_IDS.TASKS]: 3.2,
      [BLOCK_IDS.ARCHITECTURE]: 3.5,
      [BLOCK_IDS.OWNERS]: 1.8,
    }),
    maximumTextContribution: 24,
  }),

  overflowTransferOrder: Object.freeze([
    BLOCK_IDS.ARCHITECTURE,
    BLOCK_IDS.OWNERS,
    BLOCK_IDS.TASKS,
  ]),

  executiveProtectedBlocks: Object.freeze([
    BLOCK_IDS.HEADER,
    BLOCK_IDS.MEETING_STATS,
    BLOCK_IDS.EXECUTIVE_SUMMARY,
    BLOCK_IDS.KEY_METRICS,
    BLOCK_IDS.INSIGHTS,
    BLOCK_IDS.DECISIONS,
    BLOCK_IDS.RISKS,
    BLOCK_IDS.FOOTER,
  ]),

  nonRepeatableOnContinuation: Object.freeze([
    BLOCK_IDS.MEETING_STATS,
    BLOCK_IDS.EXECUTIVE_SUMMARY,
  ]),
});

export function validateCompositionRules(rules = COMPOSITION_RULES) {
  const capacity = rules?.page?.defaultCapacity;
  if (!Number.isFinite(capacity) || capacity <= 0) {
    throw new TypeError("Composition rules: page.defaultCapacity must be a positive number.");
  }

  const multipliers = rules?.density?.massMultiplier;
  for (const density of Object.values(DENSITY)) {
    const value = multipliers?.[density];
    if (!Number.isFinite(value) || value <= 0 || value > 1) {
      throw new TypeError(`Composition rules: invalid density multiplier for "${density}".`);
    }
  }

  return true;
}
