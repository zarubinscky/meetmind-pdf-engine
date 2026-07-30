/**
 * MeetMind Executive PDF Engine
 * Composition Types v1.1
 *
 * Canonical public contracts shared by Composition Engine,
 * Layout Engine and Renderer.
 *
 * Pipeline contract:
 *
 * report_json
 *   → CompositionBlock
 *   → CompositionBlock + layout
 *   → Renderer
 *
 * No adapter model or PreparedBlockBuilder is required.
 */

export const BLOCK_IDS = Object.freeze({

  HEADER: "header",

  MEETING_STATS: "stats",

  EXECUTIVE_SUMMARY: "summary",

  KEY_METRICS: "metrics",
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
 * @typedef {
 *   "header" |
 *   "meetingStats" |
 *   "executiveSummary" |
 *   "keyMetrics" |
 *   "insights" |
 *   "decisions" |
 *   "risks" |
 *   "tasks" |
 *   "architecture" |
 *   "owners" |
 *   "footer"
 * } BlockId
 */

/**
 * @typedef {"regular"|"compact"|"dense"} Density
 */

/**
 * @typedef {"executive"|"continuation"} PageKind
 */

/**
 * @typedef {
 *   "stack" |
 *   "balancedExecutiveTrio" |
 *   "dominantInsights" |
 *   "dominantDecisions" |
 *   "dominantRisks" |
 *   "tasksFullWidth" |
 *   "tasksArchitectureSideBySide"
 * } CompositionKind
 */

/**
 * Exact block geometry calculated by Layout Engine.
 *
 * Composition Engine always initializes block.layout as null.
 *
 * @typedef {Object} BlockGeometry
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {number=} contentX
 * @property {number=} contentY
 * @property {number=} contentWidth
 * @property {number=} contentHeight
 */

/**
 * Layout metadata added by Layout Engine.
 *
 * @typedef {Object} BlockLayout
 * @property {number} pageNumber
 * @property {number} regionIndex
 * @property {number} columnIndex
 * @property {number} columnSpan
 * @property {BlockGeometry} geometry
 */

/**
 * Canonical block object used throughout the pipeline.
 *
 * Composition Engine creates this object.
 * Layout Engine enriches the `layout` property.
 * Renderer consumes the same object.
 *
 * @typedef {Object} CompositionBlock
 * @property {BlockId} id
 * @property {*} data
 * @property {number} itemCount
 * @property {number} textLength
 * @property {number} mass
 * @property {Density} density
 * @property {boolean} visible
 * @property {boolean} required
 * @property {BlockLayout|null} layout
 */

/**
 * Backward-compatible alias used by Composition Engine v1.0 code.
 *
 * @typedef {CompositionBlock} MeasuredBlock
 */

/**
 * @typedef {Object} CompositionRegion
 * @property {CompositionKind} kind
 * @property {BlockId[]} blockIds
 * @property {number[]} columns
 * @property {Density=} density
 * @property {Object<string, *>=} metadata
 */

/**
 * @typedef {Object} CompositionPage
 * @property {number} number
 * @property {number} totalPages
 * @property {PageKind} kind
 * @property {string} title
 * @property {string|null} date
 * @property {string|null} pageIndicator
 * @property {BlockId[]} blockIds
 * @property {CompositionRegion[]} regions
 * @property {number} estimatedMass
 */

/**
 * @typedef {Object} CompositionDiagnostics
 * @property {number} capacity
 * @property {number} pageCount
 * @property {BlockId[]} visibleBlockIds
 * @property {Record<string, number>} blockMasses
 * @property {string[]} warnings
 */

/**
 * @typedef {Object} CompositionOptions
 * @property {Partial<Record<BlockId, boolean>>=} visibility
 * @property {number=} pageCapacity
 * @property {boolean=} allowSecondPage
 * @property {Density=} preferredDensity
 */

/**
 * @typedef {Object} CompositionResult
 * @property {string} version
 * @property {string} title
 * @property {string|null} date
 * @property {CompositionPage[]} pages
 * @property {Record<BlockId, CompositionBlock>} blocks
 * @property {CompositionDiagnostics} diagnostics
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
 * Verifies that block identifiers preserve immutable business order.
 *
 * @param {string[]} ids
 * @returns {true}
 */
export function assertCanonicalOrder(ids) {
  if (!Array.isArray(ids)) {
    throw new TypeError(
      "Composition Types: ids must be an array.",
    );
  }

  let previousIndex = -1;

  for (const id of ids) {
    const currentIndex = CANONICAL_ORDER.indexOf(id);

    if (currentIndex === -1) {
      throw new TypeError(
        `Composition Types: unknown block id "${String(id)}".`,
      );
    }

    if (currentIndex < previousIndex) {
      throw new Error(
        "Composition Types: block order violates CANONICAL_ORDER.",
      );
    }

    previousIndex = currentIndex;
  }

  return true;
}
