/**
 * MeetMind Executive PDF Engine
 * Pipeline Integration — Release 0.4
 *
 * report_json -> Composition Engine -> Layout Engine -> Renderer
 *
 * The pipeline is dependency-injected intentionally. It allows the existing
 * ES-module Composition Engine and browser-global Layout Engine to coexist
 * until the final repository revision standardizes module loading.
 */
(function attachMeetMindPdfPipeline(globalScope) {
    'use strict';

    const NAME = 'MeetMindPdfPipeline';
    const VERSION = '0.4.0';

    class PipelineError extends Error {
        constructor(code, message, details) {
            super(message);
            this.name = 'PipelineError';
            this.code = code;
            this.details = details || null;
        }
    }

    function isObject(value) {
        return Boolean(value) &&
            typeof value === 'object' &&
            !Array.isArray(value);
    }

    function assertFunction(value, name) {
        if (typeof value !== 'function') {
            throw new PipelineError(
                'INVALID_DEPENDENCY',
                `${name} must be a function.`
            );
        }
    }

    function create(options) {
        const config = isObject(options) ? options : {};
        const compose =
            config.compose ||
            globalScope.MeetMindCompositionEngine?.compose ||
            globalScope.MeetMindCompositionEngine?.composeExecutiveReport;
        const layout =
            config.layout ||
            globalScope.MeetMindLayoutEngine?.layout;
        const render =
            config.render ||
            globalScope.MeetMindRenderer?.render;

        assertFunction(compose, 'compose');
        assertFunction(layout, 'layout');
        assertFunction(render, 'render');

        function run(reportJson, runOptions) {
            if (!isObject(reportJson)) {
                throw new PipelineError(
                    'INVALID_REPORT',
                    'reportJson must be an object.'
                );
            }

            const options = isObject(runOptions) ? runOptions : {};
            const compositionResult = compose(
                reportJson,
                options.composition
            );
            const layoutResult = layout(
                compositionResult,
                options.layout
            );

            if (layoutResult?.valid === false &&
                options.allowInvalidLayout !== true) {
                throw new PipelineError(
                    'INVALID_LAYOUT',
                    'Layout Engine returned an invalid LayoutResult.',
                    layoutResult.diagnostics
                );
            }

            const renderResult = render(
                layoutResult,
                options.renderContext,
                options.renderer
            );

            return Object.freeze({
                engine: Object.freeze({
                    name: NAME,
                    version: VERSION
                }),
                compositionResult,
                layoutResult,
                renderResult
            });
        }

        return Object.freeze({
            name: NAME,
            version: VERSION,
            run
        });
    }

    const api = Object.freeze({
        name: NAME,
        version: VERSION,
        create,
        PipelineError
    });

    globalScope[NAME] = api;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
})(
    typeof globalThis !== 'undefined'
        ? globalThis
        : typeof window !== 'undefined'
            ? window
            : this
);
