/**
 * MeetMind Executive PDF Engine
 * Renderer Orchestrator — Golden Release 1.0
 *
 * Responsibilities only:
 * - validate LayoutResult;
 * - create one page-scoped RenderContext per page;
 * - resolve the semantic block renderer;
 * - invoke renderer with immutable Layout geometry.
 *
 * No layout, pagination, content truncation or business decisions live here.
 */
(function attachMeetMindRenderer(globalScope) {
    'use strict';

    const NAME = 'MeetMindRenderer';
    const VERSION = '1.0.0-golden';

    class RendererError extends Error {
        constructor(code, message, details) {
            super(message);
            this.name = 'RendererError';
            this.code = code;
            this.details = details || null;
        }
    }

    function isObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function cloneGeometry(block) {
        const source = isObject(block.geometry)
            ? block.geometry
            : isObject(block.layout?.geometry)
                ? block.layout.geometry
                : block;

        const geometry = {
            x: Number(source.x),
            y: Number(source.y),
            width: Number(source.width),
            height: Number(source.height)
        };

        for (const [key, value] of Object.entries(geometry)) {
            if (!Number.isFinite(value)) {
                throw new RendererError('INVALID_GEOMETRY', `Block "${block.id}" has invalid geometry.${key}.`, { blockId: block.id, geometry });
            }
        }
        if (geometry.width <= 0 || geometry.height <= 0) {
            throw new RendererError('INVALID_DIMENSION', `Block "${block.id}" must have positive dimensions.`, { blockId: block.id, geometry });
        }
        return Object.freeze(geometry);
    }

    function normalizeBlock(block, page) {
        if (!isObject(block)) throw new RendererError('INVALID_BLOCK', 'Every LayoutResult block must be an object.');
        const id = String(block.id || block.type || '').trim();
        if (!id) throw new RendererError('MISSING_BLOCK_ID', 'Every LayoutResult block must have id or type.');
        return Object.freeze({
            ...block,
            id,
            type: String(block.type || id),
            geometry: cloneGeometry(block),
            pageNumber: page.number,
            density: block.density || page.density || page.resolvedDensity || 'regular'
        });
    }

    function validateLayoutResult(layoutResult) {
        if (!isObject(layoutResult)) throw new RendererError('INVALID_LAYOUT_RESULT', 'layoutResult must be an object.');
        if (!Array.isArray(layoutResult.pages)) throw new RendererError('MISSING_PAGES', 'layoutResult.pages must be an array.');
        if (Number.isInteger(layoutResult.pageCount) && layoutResult.pageCount !== layoutResult.pages.length) {
            throw new RendererError('PAGE_COUNT_MISMATCH', 'layoutResult.pageCount must equal pages.length.');
        }
        layoutResult.pages.forEach((page, index) => {
            if (!isObject(page) || !Array.isArray(page.blocks)) {
                throw new RendererError('INVALID_PAGE', `Page at index ${index} must contain blocks[].`);
            }
        });
    }

    function resolveBlockRenderer(block, options) {
        const config = isObject(options) ? options : {};
        const registry = config.blockRegistry || globalScope.ExecutiveSlideEngine?.blockRegistry;
        const renderers = config.blockRenderers || globalScope.ExecutiveSlideEngine?.blockRenderers;

        let definition = null;
        if (registry && typeof registry.get === 'function') definition = registry.get(block.id);
        else if (isObject(registry)) definition = registry[block.id] || null;

        const rendererName = definition?.renderer || block.renderer || block.type || block.id;
        const candidate = renderers?.[rendererName] || renderers?.[block.id];

        if (typeof candidate === 'function') return candidate;
        if (candidate && typeof candidate.render === 'function') return candidate.render.bind(candidate);
        if (typeof config.fallbackRenderer === 'function') return config.fallbackRenderer;

        throw new RendererError('RENDERER_NOT_FOUND', `No Block Renderer found for "${block.id}".`, { blockId: block.id, rendererName });
    }

    function render(layoutResult, renderContext, options = {}) {
        validateLayoutResult(layoutResult);
        if (!renderContext || typeof renderContext.getPageContext !== 'function') {
            throw new RendererError('INVALID_RENDER_CONTEXT', 'renderContext.getPageContext(page) is required.');
        }

        const renderedPages = [];
        for (const page of layoutResult.pages) {
            const pageContext = renderContext.getPageContext(page);
            pageContext.beginPage(page);
            const renderedBlocks = [];

            for (const rawBlock of page.blocks) {
                const block = normalizeBlock(rawBlock, page);
                const blockRenderer = resolveBlockRenderer(block, options);
                blockRenderer(block, pageContext);
                renderedBlocks.push(block.id);
            }

            pageContext.endPage(page);
            renderedPages.push(Object.freeze({ pageNumber: page.number, blockIds: Object.freeze(renderedBlocks) }));
        }

        if (typeof renderContext.finalize === 'function') renderContext.finalize(layoutResult);
        return Object.freeze({ engine: Object.freeze({ name: NAME, version: VERSION }), pageCount: renderedPages.length, pages: Object.freeze(renderedPages) });
    }

    const api = Object.freeze({ name: NAME, version: VERSION, render, RendererError });
    globalScope[NAME] = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
