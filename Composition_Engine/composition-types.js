/**
 * MeetMind Executive PDF Engine
 * Composition Types v1.0
 *
 * Public contracts shared between Composition Engine,
 * Layout Engine and Renderer.
 */

export const BLOCK_IDS = Object.freeze({
  HEADER: "header",
  MEETING_STATS: "meetingStats",
  EXECUTIVE_SUMMARY: "executiveSummary",
  KEY_METRICS: "keyMetrics",
  INSIGHTS: "insights",
  DECISIONS: "decisions",
  RISKS: "risks",
  TASKS: "tasks",
  ARCHITECTURE: "architecture",
  OWNERS: "owners",
  FOOTER: "footer",
});

export const CANONICAL_ORDER = Object.freeze([
  BLOCK_IDS.HEADER,
  BLOCK_IDS.MEETING_STATS,
  BLOCK_IDS.EXECUTIVE_SUMMARY,
  BLOCK_IDS.KEY_METRICS,
  BLOCK_IDS.INSIGHTS,
  BLOCK_IDS.DECISIONS,
  BLOCK_IDS.RISKS,
  BLOCK_IDS.TASKS,
  BLOCK_IDS.ARCHITECTURE,
  BLOCK_IDS.OWNERS,
  BLOCK_IDS.FOOTER,
]);

export const DENSITY = Object.freeze({
  REGULAR: "regular",
  COMPACT: "compact",
  DENSE: "dense",
});

export const PAGE_KIND = Object.freeze({
  EXECUTIVE: "executive",
  CONTINUATION: "continuation",
});

export const COMPOSITION_KIND = Object.freeze({
  STACK: "stack",

  BALANCED_EXECUTIVE_TRIO: "balancedExecutiveTrio",

  DOMINANT_INSIGHTS: "dominantInsights",

  DOMINANT_DECISIONS: "dominantDecisions",

  DOMINANT_RISKS: "dominantRisks",

  TASKS_FULL_WIDTH: "tasksFullWidth",

  TASKS_ARCHITECTURE_SIDE_BY_SIDE:
    "tasksArchitectureSideBySide",
});

/**
 * Runtime validation helpers
 */

export function isBlockId(value) {
  return Object.values(BLOCK_IDS).includes(value);
}

export function isDensity(value) {
  return Object.values(DENSITY).includes(value);
}

export function isPageKind(value) {
  return Object.values(PAGE_KIND).includes(value);
}

export function isCompositionKind(value) {
  return Object.values(COMPOSITION_KIND).includes(value);
}

/**
 * Composition contracts
 */

/**
 * @typedef {Object} CompositionOptions
 * @property {Object=} visibility
 * @property {number=} pageCapacity
 * @property {boolean=} allowSecondPage
 * @property {string=} preferredDensity
 */

/**
 * @typedef {Object} MeasuredBlock
 * @property {string} id
 * @property {*} data
 * @property {number} itemCount
 * @property {number} textLength
 * @property {number} mass
 * @property {string} density
 * @property {boolean} visible
 * @property {boolean} required
 */

/**
 * @typedef {Object} CompositionResult
 * @property {string} version
 * @property {string} title
 * @property {string|null} date
 * @property {Array} pages
 * @property {Object} blocks
 * @property {Object} diagnostics
 */
