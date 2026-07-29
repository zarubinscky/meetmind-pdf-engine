/**
 * MeetMind Executive PDF Engine
 * RenderContext Factory — Release 0.4
 *
 * This is a small adapter around an external Drawing Surface.
 * It enforces the frozen page-scoped RenderContext contract.
 */
(function attachMeetMindRenderContext(globalScope) {
    'use strict';

    const NAME = 'MeetMindRenderContext';
    const VERSION = '0.4.0';

    class RenderContextError extends Error {
        constructor(code, message, details) {
            super(message);
            this.name = 'RenderContextError';
            this.code = code;
            this.details = details || null;
        }
    }

    function isObject(value) {
        return Boolean(value) &&
            typeof value === 'object' &&
            !Array.isArray(value);
    }

    function assertMethod(target, method) {
        if (typeof target?.[method] !== 'function') {
            throw new RenderContextError(
                'MISSING_DRAWING_METHOD',
                `Drawing Surface must expose ${method}().`
            );
        }
    }

    function create(drawingSurface, options) {
        if (!isObject(drawingSurface)) {
            throw new RenderContextError(
                'INVALID_DRAWING_SURFACE',
                'drawingSurface must be an object.'
            );
        }

        const config = isObject(options) ? options : {};
        const pageContexts = new Map();

        function createPageContext(page) {
            if (typeof drawingSurface.createPage === 'function') {
                drawingSurface.createPage(page.size, page);
            }

            const pageHandle =
                typeof drawingSurface.getCurrentPage === 'function'
                    ? drawingSurface.getCurrentPage()
                    : page.number;

            const context = {
                page,
                pageHandle,
                tokens: config.tokens || null,

                beginPage(currentPage) {
                    if (typeof drawingSurface.beginPage === 'function') {
                        drawingSurface.beginPage(pageHandle, currentPage);
                    }
                },

                endPage(currentPage) {
                    if (typeof drawingSurface.endPage === 'function') {
                        drawingSurface.endPage(pageHandle, currentPage);
                    }
                },

                text(value, geometry, style) {
                    assertMethod(drawingSurface, 'drawText');
                    return drawingSurface.drawText(
                        pageHandle,
                        String(value ?? ''),
                        geometry,
                        style || {}
                    );
                },

                rect(geometry, style) {
                    assertMethod(drawingSurface, 'drawRect');
                    return drawingSurface.drawRect(
                        pageHandle,
                        geometry,
                        style || {}
                    );
                },

                line(from, to, style) {
                    assertMethod(drawingSurface, 'drawLine');
                    return drawingSurface.drawLine(
                        pageHandle,
                        from,
                        to,
                        style || {}
                    );
                },

                icon(icon, geometry, style) {
                    assertMethod(drawingSurface, 'drawIcon');
                    return drawingSurface.drawIcon(
                        pageHandle,
                        icon,
                        geometry,
                        style || {}
                    );
                },

                table(model, geometry, style) {
                    if (typeof drawingSurface.drawTable !== 'function') {
                        throw new RenderContextError(
                            'MISSING_DRAWING_METHOD',
                            'Drawing Surface must expose drawTable() for table rendering.'
                        );
                    }
                    return drawingSurface.drawTable(
                        pageHandle,
                        model,
                        geometry,
                        style || {}
                    );
                }
            };

            return Object.freeze(context);
        }

        function getPageContext(page) {
            const key = page.id || page.number;
            if (!pageContexts.has(key)) {
                pageContexts.set(key, createPageContext(page));
            }
            return pageContexts.get(key);
        }

        function finalize(layoutResult) {
            if (typeof drawingSurface.finalize === 'function') {
                return drawingSurface.finalize(layoutResult);
            }
            return null;
        }

        return Object.freeze({
            name: NAME,
            version: VERSION,
            getPageContext,
            forPage: getPageContext,
            finalize
        });
    }

    const api = Object.freeze({
        name: NAME,
        version: VERSION,
        create,
        RenderContextError
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
