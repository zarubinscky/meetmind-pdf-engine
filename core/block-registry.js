/*
 * MeetMind AI
 * Executive Slide Engine
 *
 * Block Registry v1.0
 *
 * Single declarative source of truth for Executive PDF Engine blocks.
 *
 * This module contains no:
 * - rendering logic;
 * - layout logic;
 * - measurement logic;
 * - validation logic;
 * - report-content inspection;
 * - business logic;
 * - localization;
 * - external dependencies.
 *
 * Public contract:
 *
 * ExecutiveSlideEngine.blockRegistry.version
 * ExecutiveSlideEngine.blockRegistry.definitions
 * ExecutiveSlideEngine.blockRegistry.get(id)
 * ExecutiveSlideEngine.blockRegistry.has(id)
 * ExecutiveSlideEngine.blockRegistry.list()
 */

(function initializeBlockRegistry(global) {
    'use strict';

    const engine = global.ExecutiveSlideEngine || {};
    const VERSION = '1.0.0';

    const OVERFLOW = Object.freeze({
        PAGINATE: 'paginate',
        TRUNCATE: 'truncate',
        HIDE: 'hide'
    });

    const DEFINITIONS = deepFreeze({
        version: VERSION,

        blocks: {
            header: {
                id: 'header',
                reportField: 'title',
                renderer: 'header',
                priority: 100,
                overflow: OVERFLOW.PAGINATE,
                enabledByDefault: true,
                allowDisable: false
            },

            summary: {
                id: 'summary',
                reportField: 'summary',
                renderer: 'summary',
                priority: 200,
                overflow: OVERFLOW.PAGINATE,
                enabledByDefault: true,
                allowDisable: true
            },

            decisions: {
                id: 'decisions',
                reportField: 'decisions',
                renderer: 'decisions',
                priority: 300,
                overflow: OVERFLOW.PAGINATE,
                enabledByDefault: true,
                allowDisable: true
            },

            tasks: {
                id: 'tasks',
                reportField: 'tasks',
                renderer: 'tasks',
                priority: 400,
                overflow: OVERFLOW.PAGINATE,
                enabledByDefault: true,
                allowDisable: true
            },

            risks: {
                id: 'risks',
                reportField: 'risks',
                renderer: 'risks',
                priority: 500,
                overflow: OVERFLOW.PAGINATE,
                enabledByDefault: true,
                allowDisable: true
            },

            insights: {
                id: 'insights',
                reportField: 'insights',
                renderer: 'insights',
                priority: 600,
                overflow: OVERFLOW.PAGINATE,
                enabledByDefault: true,
                allowDisable: true
            },

            owners: {
                id: 'owners',
                reportField: 'owners',
                renderer: 'owners',
                priority: 700,
                overflow: OVERFLOW.PAGINATE,
                enabledByDefault: true,
                allowDisable: true
            },

            architecture: {
                id: 'architecture',
                reportField: 'architecture',
                renderer: 'architecture',
                priority: 800,
                overflow: OVERFLOW.PAGINATE,
                enabledByDefault: true,
                allowDisable: true
            },

            metrics: {
                id: 'metrics',
                reportField: 'metrics',
                renderer: 'metrics',
                priority: 900,
                overflow: OVERFLOW.PAGINATE,
                enabledByDefault: true,
                allowDisable: true
            },

            stats: {
                id: 'stats',
                reportField: 'stats',
                renderer: 'stats',
                priority: 1000,
                overflow: OVERFLOW.PAGINATE,
                enabledByDefault: true,
                allowDisable: true
            },

            footer: {
                id: 'footer',
                reportField: null,
                renderer: 'footer',
                priority: 1100,
                overflow: OVERFLOW.PAGINATE,
                enabledByDefault: true,
                allowDisable: false
            }
        }
    });

    validateDefinitions();

    /**
     * Returns an immutable block definition by id.
     *
     * @param {string} id
     * @returns {Object|undefined}
     */
    function get(id) {
        return DEFINITIONS.blocks[id];
    }

    /**
     * Checks whether a block id exists.
     *
     * @param {string} id
     * @returns {boolean}
     */
    function has(id) {
        return Object.prototype.hasOwnProperty.call(
            DEFINITIONS.blocks,
            id
        );
    }

    /**
     * Returns the immutable ordered list of block definitions.
     *
     * @returns {Array<Object>}
     */
    function list() {
        return Object.freeze(
            Object.values(DEFINITIONS.blocks)
                .slice()
                .sort(function(left,right){
                    return left.priority-right.priority;
                })
        );
    }

    function validateDefinitions() {
        const allowedOverflow = new Set(Object.values(OVERFLOW));
        const priorities = new Set();

        Object.keys(DEFINITIONS.blocks).forEach(function(key){
            const block = DEFINITIONS.blocks[key];
            if (key !== block.id) {
                throw new Error('Block id mismatch: ' + key);
            }
            if (priorities.has(block.priority)) {
                throw new Error('Duplicate priority: ' + block.priority);
            }
            priorities.add(block.priority);
            if (!allowedOverflow.has(block.overflow)) {
                throw new Error('Unknown overflow: ' + block.overflow);
            }
            if (typeof block.renderer !== 'string') {
                throw new Error('Invalid renderer: ' + key);
            }
        });
    }

    /**
     * Recursively freezes an object graph.
     *
     * @param {*} value
     * @param {WeakSet<Object>} [visited]
     * @returns {*}
     */
    function deepFreeze(value, visited) {
        if (
            value === null ||
            (
                typeof value !== 'object' &&
                typeof value !== 'function'
            )
        ) {
            return value;
        }

        const seen = visited || new WeakSet();

        if (seen.has(value)) {
            return value;
        }

        seen.add(value);

        Reflect.ownKeys(value).forEach(function freezeProperty(key) {
            deepFreeze(value[key], seen);
        });

        return Object.freeze(value);
    }

    engine.blockRegistry = Object.freeze({
        version: DEFINITIONS.version,
        definitions: DEFINITIONS,
        get,
        has,
        list
    });

    global.ExecutiveSlideEngine = engine;

})(
    typeof window !== 'undefined'
        ? window
        : globalThis
);
