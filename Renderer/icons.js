/*
 * MeetMind AI
 * Executive Slide Engine
 *
 * Icon Registry
 *
 * Static SVG geometry for Executive PDF v1.0.
 *
 * Lucide is used only as the source of canonical icon geometry.
 * This module has no runtime dependency on Lucide or any other library.
 *
 * This module contains no:
 * - user-facing strings;
 * - localization dictionaries;
 * - business block mappings;
 * - renderer logic;
 * - PDF drawing logic;
 * - sizes, colors, or coordinates;
 * - dynamic SVG generation.
 *
 * Public contract:
 *
 * ExecutiveSlideEngine.icons.get(name)
 * ExecutiveSlideEngine.icons.has(name)
 *
 * Returned icon objects are immutable.
 * Callers must treat them as read-only and must not modify them.
 *
 * Compatibility notes:
 *
 * - check-circle-2 is a deprecated Lucide alias of circle-check.
 * - layers-3 is a deprecated Lucide alias of layers.
 * - circle-help is a deprecated Lucide alias of circle-question-mark.
 *
 * Deprecated names are resolved internally for backward compatibility.
 * All new modules must use canonical Lucide identifiers only.
 */

(function initializeIcons(global) {
    'use strict';

    const engine = global.ExecutiveSlideEngine || {};
    const FALLBACK_ICON_NAME = 'circle-question-mark';
    const VIEW_BOX = '0 0 24 24';

    const registry = deepFreeze({
        users: {
            name: 'users',
            viewBox: VIEW_BOX,
            nodes: [
                ['path', {
                    d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'
                }],
                ['circle', {
                    cx: '9',
                    cy: '7',
                    r: '4'
                }],
                ['path', {
                    d: 'M22 21v-2a4 4 0 0 0-3-3.87'
                }],
                ['path', {
                    d: 'M16 3.13a4 4 0 0 1 0 7.75'
                }]
            ]
        },

        'file-text': {
            name: 'file-text',
            viewBox: VIEW_BOX,
            nodes: [
                ['path', {
                    d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z'
                }],
                ['polyline', {
                    points: '14 2 14 8 20 8'
                }],
                ['line', {
                    x1: '16',
                    x2: '8',
                    y1: '13',
                    y2: '13'
                }],
                ['line', {
                    x1: '16',
                    x2: '8',
                    y1: '17',
                    y2: '17'
                }],
                ['line', {
                    x1: '10',
                    x2: '8',
                    y1: '9',
                    y2: '9'
                }]
            ]
        },

        'circle-check': {
            name: 'circle-check',
            viewBox: VIEW_BOX,
            nodes: [
                ['circle', {
                    cx: '12',
                    cy: '12',
                    r: '10'
                }],
                ['path', {
                    d: 'm9 12 2 2 4-4'
                }]
            ]
        },

        'clipboard-list': {
            name: 'clipboard-list',
            viewBox: VIEW_BOX,
            nodes: [
                ['rect', {
                    width: '8',
                    height: '4',
                    x: '8',
                    y: '2',
                    rx: '1',
                    ry: '1'
                }],
                ['path', {
                    d: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'
                }],
                ['path', {
                    d: 'M12 11h4'
                }],
                ['path', {
                    d: 'M12 16h4'
                }],
                ['path', {
                    d: 'M8 11h.01'
                }],
                ['path', {
                    d: 'M8 16h.01'
                }]
            ]
        },

        'user-round': {
            name: 'user-round',
            viewBox: VIEW_BOX,
            nodes: [
                ['circle', {
                    cx: '12',
                    cy: '8',
                    r: '5'
                }],
                ['path', {
                    d: 'M20 21a8 8 0 0 0-16 0'
                }]
            ]
        },

        'triangle-alert': {
            name: 'triangle-alert',
            viewBox: VIEW_BOX,
            nodes: [
                ['path', {
                    d: 'm21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3'
                }],
                ['path', {
                    d: 'M12 9v4'
                }],
                ['path', {
                    d: 'M12 17h.01'
                }]
            ]
        },

        lightbulb: {
            name: 'lightbulb',
            viewBox: VIEW_BOX,
            nodes: [
                ['path', {
                    d: 'M9 18h6'
                }],
                ['path', {
                    d: 'M10 22h4'
                }],
                ['path', {
                    d: 'M15.09 14c.18-.68.66-1.18 1.22-1.74A6 6 0 1 0 7.69 12.26C8.25 12.82 8.73 13.32 8.91 14'
                }]
            ]
        },

        calendar: {
            name: 'calendar',
            viewBox: VIEW_BOX,
            nodes: [
                ['path', {
                    d: 'M8 2v4'
                }],
                ['path', {
                    d: 'M16 2v4'
                }],
                ['rect', {
                    width: '18',
                    height: '18',
                    x: '3',
                    y: '4',
                    rx: '2'
                }],
                ['path', {
                    d: 'M3 10h18'
                }]
            ]
        },

        'clock-3': {
            name: 'clock-3',
            viewBox: VIEW_BOX,
            nodes: [
                ['circle', {
                    cx: '12',
                    cy: '12',
                    r: '10'
                }],
                ['polyline', {
                    points: '12 6 12 12 16.5 9.5'
                }]
            ]
        },

        network: {
            name: 'network',
            viewBox: VIEW_BOX,
            nodes: [
                ['rect', {
                    x: '16',
                    y: '16',
                    width: '6',
                    height: '6',
                    rx: '1'
                }],
                ['rect', {
                    x: '2',
                    y: '16',
                    width: '6',
                    height: '6',
                    rx: '1'
                }],
                ['rect', {
                    x: '9',
                    y: '2',
                    width: '6',
                    height: '6',
                    rx: '1'
                }],
                ['path', {
                    d: 'M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3'
                }],
                ['path', {
                    d: 'M12 12V8'
                }]
            ]
        },

        boxes: {
            name: 'boxes',
            viewBox: VIEW_BOX,
            nodes: [
                ['path', {
                    d: 'M2.97 12.92a2 2 0 0 0 0 2.16l2 3.5a2 2 0 0 0 1.79 1H10a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5a2 2 0 0 0-2.03 1.34Z'
                }],
                ['path', {
                    d: 'm7 16 2-3'
                }],
                ['path', {
                    d: 'm7 16 2 3'
                }],
                ['path', {
                    d: 'M13.03 12.92a2 2 0 0 0 0 2.16l2 3.5a2 2 0 0 0 1.79 1H20a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-5a2 2 0 0 0-1.97 1.34Z'
                }],
                ['path', {
                    d: 'm17 16 2-3'
                }],
                ['path', {
                    d: 'm17 16 2 3'
                }],
                ['path', {
                    d: 'M7.97 3.42a2 2 0 0 0 0 2.16l2 3.5a2 2 0 0 0 1.79 1H15a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-5a2 2 0 0 0-2.03 1.34Z'
                }],
                ['path', {
                    d: 'm12 6.5 2-3'
                }],
                ['path', {
                    d: 'm12 6.5 2 3'
                }]
            ]
        },

        layers: {
            name: 'layers',
            viewBox: VIEW_BOX,
            nodes: [
                ['path', {
                    d: 'm12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z'
                }],
                ['path', {
                    d: 'm22 12.5-9.17 4.17a2 2 0 0 1-1.66 0L2 12.5'
                }],
                ['path', {
                    d: 'm22 17.5-9.17 4.17a2 2 0 0 1-1.66 0L2 17.5'
                }]
            ]
        },

        'chart-column': {
            name: 'chart-column',
            viewBox: VIEW_BOX,
            nodes: [
                ['path', {
                    d: 'M3 3v18h18'
                }],
                ['path', {
                    d: 'M18 17V9'
                }],
                ['path', {
                    d: 'M13 17V5'
                }],
                ['path', {
                    d: 'M8 17v-3'
                }]
            ]
        },

        target: {
            name: 'target',
            viewBox: VIEW_BOX,
            nodes: [
                ['circle', {
                    cx: '12',
                    cy: '12',
                    r: '10'
                }],
                ['circle', {
                    cx: '12',
                    cy: '12',
                    r: '6'
                }],
                ['circle', {
                    cx: '12',
                    cy: '12',
                    r: '2'
                }]
            ]
        },

        'circle-question-mark': {
            name: 'circle-question-mark',
            viewBox: VIEW_BOX,
            nodes: [
                ['circle', {
                    cx: '12',
                    cy: '12',
                    r: '10'
                }],
                ['path', {
                    d: 'M9.09 9a3 3 0 1 1 5.83 1c0 2-3 3-3 3'
                }],
                ['path', {
                    d: 'M12 17h.01'
                }]
            ]
        }
    });

    const aliases = deepFreeze({
        'check-circle-2': 'circle-check',
        'layers-3': 'layers',
        'circle-help': 'circle-question-mark'
    });

    function get(name) {
        const canonicalName = resolveName(name);

        if (
            canonicalName &&
            Object.prototype.hasOwnProperty.call(
                registry,
                canonicalName
            )
        ) {
            return registry[canonicalName];
        }

        warn(
            'Unknown icon. Falling back to circle-question-mark.',
            name
        );

        return registry[FALLBACK_ICON_NAME];
    }

    function has(name) {
        const canonicalName = resolveName(name);

        return Boolean(
            canonicalName &&
            Object.prototype.hasOwnProperty.call(
                registry,
                canonicalName
            )
        );
    }

    function resolveName(name) {
        if (typeof name !== 'string') {
            return null;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                aliases,
                name
            )
        ) {
            return aliases[name];
        }

        return name;
    }

    function warn(message, value) {
        if (typeof engine.diagnostics === 'function') {
            engine.diagnostics({
                source: 'icons',
                level: 'warn',
                message,
                value
            });

            return;
        }

        if (
            engine.debug === true &&
            global.console &&
            typeof global.console.warn === 'function'
        ) {
            global.console.warn(
                `Executive Slide Engine: ${message}`,
                value
            );
        }
    }

    function deepFreeze(value) {
        if (
            !value ||
            typeof value !== 'object' ||
            Object.isFrozen(value)
        ) {
            return value;
        }

        Object.getOwnPropertyNames(value)
            .forEach(propertyName => {
                deepFreeze(
                    value[propertyName]
                );
            });

        return Object.freeze(value);
    }

    engine.icons = Object.freeze({
        get,
        has
    });

    global.ExecutiveSlideEngine = engine;

})(
    typeof globalThis !== 'undefined'
        ? globalThis
        : window
);
