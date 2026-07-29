/**
 * MeetMind Executive PDF Engine
 * Layout Engine — v1.0.0
 *
 * Responsibility:
 *   Convert a strict CompositionResult into deterministic page geometry.
 *
 * Input contract:
 *   CompositionResult {
 *     pages: CompositionPage[]
 *   }
 *
 *   CompositionPage {
 *     id?: string,
 *     number?: number,
 *     template?: string,
 *     density?: 'regular' | 'compact' | 'dense' | 'truncated',
 *     blocks: CompositionBlock[]
 *   }
 *
 *   CompositionBlock {
 *     id: string,
 *     data: unknown,
 *     itemCount: number,
 *     textLength: number,
 *     mass: number,
 *     density: string,
 *     visible: boolean,
 *     required: boolean,
 *     layout: null
 *   }
 *
 * Output contract:
 *   LayoutResult contains the same logical block model enriched with:
 *
 *   block.layout = {
 *     pageNumber,
 *     region,
 *     column,
 *     order,
 *     role,
 *     fits,
 *     geometry: { x, y, width, height }
 *   }
 *
 * Explicitly out of scope:
 *   - report_json normalization
 *   - visibility decisions
 *   - business priority
 *   - pagination decisions
 *   - exact glyph measurement
 *   - PDF drawing
 *
 * Browser:
 *   const result = MeetMindLayoutEngine.layout(compositionResult, options);
 *
 * CommonJS:
 *   const LayoutEngine = require('./layout-engine');
 */

(function attachMeetMindLayoutEngine(globalScope) {
    'use strict';

    const ENGINE_NAME = 'MeetMindLayoutEngine';
    const ENGINE_VERSION = '1.0.0';

    const BLOCK_IDS = Object.freeze([
        'header',
        'stats',
        'summary',
        'metrics',
        'insights',
        'decisions',
        'risks',
        'tasks',
        'architecture',
        'owners',
        'footer'
    ]);

    const BLOCK_ID_SET = new Set(BLOCK_IDS);

    const SERVICE_IDS = new Set([
        'header',
        'stats',
        'footer'
    ]);

    const EXECUTIVE_IDS = new Set([
        'summary',
        'metrics',
        'insights',
        'decisions',
        'risks'
    ]);

    const DEFAULT_PAGE = Object.freeze({
        width: 1600,
        height: 900,
        margin: Object.freeze({
            top: 34,
            right: 48,
            bottom: 28,
            left: 48
        }),
        headerHeight: 62,
        statsHeight: 42,
        footerHeight: 24,
        sectionGap: 14,
        columnGap: 14,
        rowGap: 14,
        cardRadius: 14
    });

    const DEFAULT_DENSITY = Object.freeze({
        regular: Object.freeze({
            blockPadding: 18,
            sectionTitleHeight: 24,
            lineHeight: 20,
            itemGap: 9,
            tableHeaderHeight: 26,
            tableRowHeight: 31,
            metricHeight: 72,
            architectureCardHeight: 72
        }),
        compact: Object.freeze({
            blockPadding: 14,
            sectionTitleHeight: 22,
            lineHeight: 18,
            itemGap: 7,
            tableHeaderHeight: 24,
            tableRowHeight: 27,
            metricHeight: 64,
            architectureCardHeight: 64
        }),
        dense: Object.freeze({
            blockPadding: 11,
            sectionTitleHeight: 20,
            lineHeight: 16,
            itemGap: 5,
            tableHeaderHeight: 22,
            tableRowHeight: 23,
            metricHeight: 56,
            architectureCardHeight: 56
        }),
        truncated: Object.freeze({
            blockPadding: 11,
            sectionTitleHeight: 20,
            lineHeight: 16,
            itemGap: 5,
            tableHeaderHeight: 22,
            tableRowHeight: 23,
            metricHeight: 56,
            architectureCardHeight: 56
        })
    });

    const DEFAULT_BLOCK_MIN_HEIGHT = Object.freeze({
        header: 62,
        stats: 42,
        summary: 96,
        metrics: 72,
        insights: 96,
        decisions: 96,
        risks: 96,
        tasks: 104,
        architecture: 110,
        owners: 74,
        footer: 24
    });

    const TEMPLATE_CONFIG = Object.freeze({
        'vertical-flow': Object.freeze({
            columns: 1,
            dominantBlock: null,
            dominantRatio: 1
        }),
        balanced: Object.freeze({
            columns: 2,
            dominantBlock: null,
            dominantRatio: 1
        }),
        'dominant-insights': Object.freeze({
            columns: 2,
            dominantBlock: 'insights',
            dominantRatio: 1.45
        }),
        'dominant-decisions': Object.freeze({
            columns: 2,
            dominantBlock: 'decisions',
            dominantRatio: 1.45
        }),
        'dominant-risks': Object.freeze({
            columns: 2,
            dominantBlock: 'risks',
            dominantRatio: 1.45
        }),
        'continuation-page': Object.freeze({
            columns: 1,
            dominantBlock: null,
            dominantRatio: 1
        })
    });

    class LayoutError extends Error {
        constructor(code, message, details) {
            super(message);
            this.name = 'LayoutError';
            this.code = code;
            this.details = details || null;
        }
    }

    function isPlainObject(value) {
        return Boolean(value) &&
            typeof value === 'object' &&
            !Array.isArray(value);
    }

    function finiteNumber(value, fallback) {
        return Number.isFinite(value) ? value : fallback;
    }

    function positiveNumber(value, fallback) {
        return Number.isFinite(value) && value > 0 ? value : fallback;
    }

    function clone(value) {
        if (typeof structuredClone === 'function') {
            return structuredClone(value);
        }

        if (value === undefined) {
            return undefined;
        }

        return JSON.parse(JSON.stringify(value));
    }

    function normalizeToken(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[\s_]+/g, '-');
    }

    function normalizePageConfig(options) {
        const source = isPlainObject(options?.page)
            ? options.page
            : {};
        const marginSource = isPlainObject(source.margin)
            ? source.margin
            : {};

        return {
            width: positiveNumber(source.width, DEFAULT_PAGE.width),
            height: positiveNumber(source.height, DEFAULT_PAGE.height),
            margin: {
                top: finiteNumber(
                    marginSource.top,
                    DEFAULT_PAGE.margin.top
                ),
                right: finiteNumber(
                    marginSource.right,
                    DEFAULT_PAGE.margin.right
                ),
                bottom: finiteNumber(
                    marginSource.bottom,
                    DEFAULT_PAGE.margin.bottom
                ),
                left: finiteNumber(
                    marginSource.left,
                    DEFAULT_PAGE.margin.left
                )
            },
            headerHeight: positiveNumber(
                source.headerHeight,
                DEFAULT_PAGE.headerHeight
            ),
            statsHeight: positiveNumber(
                source.statsHeight,
                DEFAULT_PAGE.statsHeight
            ),
            footerHeight: positiveNumber(
                source.footerHeight,
                DEFAULT_PAGE.footerHeight
            ),
            sectionGap: finiteNumber(
                source.sectionGap,
                DEFAULT_PAGE.sectionGap
            ),
            columnGap: finiteNumber(
                source.columnGap,
                DEFAULT_PAGE.columnGap
            ),
            rowGap: finiteNumber(
                source.rowGap,
                DEFAULT_PAGE.rowGap
            ),
            cardRadius: finiteNumber(
                source.cardRadius,
                DEFAULT_PAGE.cardRadius
            )
        };
    }

    function extractCompositionPages(composition) {
        if (!isPlainObject(composition)) {
            throw new LayoutError(
                'INVALID_COMPOSITION',
                'CompositionResult must be an object.'
            );
        }

        if (!Array.isArray(composition.pages)) {
            throw new LayoutError(
                'INVALID_COMPOSITION',
                'CompositionResult.pages must be an array.'
            );
        }

        if (composition.pages.length === 0) {
            throw new LayoutError(
                'EMPTY_COMPOSITION',
                'CompositionResult.pages must contain at least one page.'
            );
        }

        return composition.pages;
    }

    function assertCompositionPage(page, pageIndex) {
        if (!isPlainObject(page)) {
            throw new LayoutError(
                'INVALID_PAGE',
                `Page at index ${pageIndex} must be an object.`,
                { pageIndex, page }
            );
        }

        if (!Array.isArray(page.blocks)) {
            throw new LayoutError(
                'INVALID_PAGE_BLOCKS',
                `Page at index ${pageIndex} must contain blocks[].`,
                { pageIndex }
            );
        }

        return page;
    }

    function assertCompositionBlock(block, blockIndex, pageIndex) {
        if (!isPlainObject(block)) {
            throw new LayoutError(
                'INVALID_BLOCK',
                `Block at page ${pageIndex + 1}, index ${blockIndex} must be an object.`,
                { pageIndex, blockIndex, block }
            );
        }

        if (typeof block.id !== 'string' || !block.id.trim()) {
            throw new LayoutError(
                'MISSING_BLOCK_ID',
                `Block at page ${pageIndex + 1}, index ${blockIndex} must have id.`,
                { pageIndex, blockIndex }
            );
        }

        const id = normalizeToken(block.id);

        if (!BLOCK_ID_SET.has(id)) {
            throw new LayoutError(
                'UNKNOWN_BLOCK_ID',
                `Unsupported CompositionBlock id "${block.id}".`,
                {
                    pageIndex,
                    blockIndex,
                    blockId: block.id,
                    allowed: BLOCK_IDS
                }
            );
        }

        if (block.layout !== null && block.layout !== undefined) {
            throw new LayoutError(
                'BLOCK_ALREADY_LAID_OUT',
                `CompositionBlock "${id}" must enter Layout Engine with layout: null.`,
                { pageIndex, blockIndex, blockId: id }
            );
        }

        return {
            ...block,
            id,
            sourceIndex: blockIndex
        };
    }

    function resolveDensity(page, composition, options) {
        const raw =
            page?.density ||
            composition?.density ||
            options?.density ||
            'regular';

        const density = normalizeToken(raw);

        return DEFAULT_DENSITY[density]
            ? density
            : 'regular';
    }

    function resolveDensityTokens(density, options) {
        const override = isPlainObject(options?.densityTokens?.[density])
            ? options.densityTokens[density]
            : {};

        return {
            ...DEFAULT_DENSITY[density],
            ...override
        };
    }

    function resolveTemplate(page) {
        const raw =
            page?.template ||
            page?.layoutTemplate ||
            (page?.continuation ? 'continuation-page' : 'vertical-flow');

        const requested = normalizeToken(raw) || 'vertical-flow';

        const applied = TEMPLATE_CONFIG[requested]
            ? requested
            : 'vertical-flow';

        return {
            requested,
            applied,
            deferred: requested !== applied,
            config: TEMPLATE_CONFIG[applied]
        };
    }

    function dataArray(block) {
        if (Array.isArray(block.data)) {
            return block.data;
        }

        if (isPlainObject(block.data)) {
            if (Array.isArray(block.data.items)) {
                return block.data.items;
            }
            if (Array.isArray(block.data.rows)) {
                return block.data.rows;
            }
            if (Array.isArray(block.data.sections)) {
                return block.data.sections;
            }
            if (Array.isArray(block.data.metrics)) {
                return block.data.metrics;
            }
            if (Array.isArray(block.data.tasks)) {
                return block.data.tasks;
            }
        }

        return [];
    }

    function dataText(block) {
        if (typeof block.data === 'string') {
            return block.data;
        }

        if (!isPlainObject(block.data)) {
            return '';
        }

        const candidates = [
            block.data.text,
            block.data.summary,
            block.data.description,
            block.data.details,
            block.data.value
        ];

        for (const candidate of candidates) {
            if (typeof candidate === 'string' && candidate.trim()) {
                return candidate;
            }
        }

        return '';
    }

    function estimateTextLines(text, width, densityTokens) {
        const value = String(text || '').trim();

        if (!value) {
            return 0;
        }

        const averageCharacterWidth =
            densityTokens.lineHeight * 0.43;

        const charactersPerLine = Math.max(
            12,
            Math.floor(width / averageCharacterWidth)
        );

        return value
            .split(/\n+/)
            .reduce((total, paragraph) => {
                const length = Math.max(
                    1,
                    paragraph.trim().length
                );

                return total +
                    Math.ceil(length / charactersPerLine);
            }, 0);
    }

    function estimateSummaryHeight(block, width, tokens) {
        const bodyWidth = Math.max(
            80,
            width - tokens.blockPadding * 2
        );

        const lines = Math.max(
            2,
            estimateTextLines(
                dataText(block),
                bodyWidth,
                tokens
            )
        );

        return tokens.blockPadding * 2 +
            tokens.sectionTitleHeight +
            lines * tokens.lineHeight;
    }

    function extractItemText(item) {
        if (typeof item === 'string') {
            return {
                title: item,
                details: ''
            };
        }

        if (!isPlainObject(item)) {
            return {
                title: String(item ?? ''),
                details: ''
            };
        }

        return {
            title:
                item.title ||
                item.name ||
                item.item ||
                item.task ||
                item.owner ||
                '',
            details:
                item.details ||
                item.description ||
                item.text ||
                item.responsibility ||
                item.deadline ||
                item.dueDate ||
                item.due_date ||
                ''
        };
    }

    function estimateListHeight(block, width, tokens) {
        const items = dataArray(block);
        const bodyWidth = Math.max(
            80,
            width - tokens.blockPadding * 2
        );

        const contentHeight = items.reduce((total, item) => {
            const text = extractItemText(item);

            const titleLines = Math.max(
                1,
                estimateTextLines(
                    text.title,
                    bodyWidth,
                    tokens
                )
            );

            const detailLines = estimateTextLines(
                text.details,
                bodyWidth,
                tokens
            );

            return total +
                (titleLines + detailLines) * tokens.lineHeight +
                tokens.itemGap;
        }, 0);

        const fallbackRows = items.length > 0
            ? 0
            : Math.max(1, finiteNumber(block.itemCount, 1));

        return tokens.blockPadding * 2 +
            tokens.sectionTitleHeight +
            contentHeight +
            fallbackRows * tokens.lineHeight;
    }

    function estimateMetricsHeight(block, width, tokens, pageConfig) {
        const metrics = dataArray(block);
        const count = Math.max(
            1,
            metrics.length || finiteNumber(block.itemCount, 1)
        );

        const minimumCardWidth = 150;

        const columns = Math.max(
            1,
            Math.floor(
                (width + pageConfig.columnGap) /
                (minimumCardWidth + pageConfig.columnGap)
            )
        );

        const rows = Math.ceil(count / columns);

        return tokens.blockPadding * 2 +
            tokens.sectionTitleHeight +
            rows * tokens.metricHeight +
            Math.max(0, rows - 1) * tokens.itemGap;
    }

    function estimateTasksHeight(block, tokens) {
        const rows = dataArray(block);

        const rowCount = Math.max(
            1,
            rows.length || finiteNumber(block.itemCount, 1)
        );

        return tokens.blockPadding * 2 +
            tokens.sectionTitleHeight +
            tokens.tableHeaderHeight +
            rowCount * tokens.tableRowHeight;
    }

    function countArchitectureCards(block) {
        const sections = dataArray(block);

        if (sections.length === 0) {
            return Math.max(
                1,
                finiteNumber(block.itemCount, 1)
            );
        }

        return sections.reduce((total, section) => {
            if (Array.isArray(section?.items)) {
                return total + Math.max(1, section.items.length);
            }
            return total + 1;
        }, 0);
    }

    function estimateArchitectureHeight(
        block,
        width,
        tokens,
        pageConfig
    ) {
        const cards = countArchitectureCards(block);
        const minimumCardWidth = 210;

        const columns = Math.max(
            1,
            Math.min(
                4,
                Math.floor(
                    (width + pageConfig.columnGap) /
                    (minimumCardWidth + pageConfig.columnGap)
                )
            )
        );

        const rows = Math.ceil(cards / columns);

        return tokens.blockPadding * 2 +
            tokens.sectionTitleHeight +
            rows * tokens.architectureCardHeight +
            Math.max(0, rows - 1) * tokens.itemGap;
    }

    function explicitBlockHeight(block) {
        const candidates = [
            block.estimatedHeight,
            block.height,
            block.data?.estimatedHeight,
            block.data?.height
        ];

        for (const candidate of candidates) {
            if (Number.isFinite(candidate) && candidate > 0) {
                return candidate;
            }
        }

        return null;
    }

    function estimateBlockHeight(block, width, context) {
        const explicitHeight = explicitBlockHeight(block);

        if (explicitHeight !== null) {
            return explicitHeight;
        }

        const {
            pageConfig,
            densityTokens
        } = context;

        switch (block.id) {
            case 'header':
                return pageConfig.headerHeight;

            case 'stats':
                return pageConfig.statsHeight;

            case 'footer':
                return pageConfig.footerHeight;

            case 'summary':
                return Math.max(
                    DEFAULT_BLOCK_MIN_HEIGHT.summary,
                    estimateSummaryHeight(
                        block,
                        width,
                        densityTokens
                    )
                );

            case 'metrics':
                return Math.max(
                    DEFAULT_BLOCK_MIN_HEIGHT.metrics,
                    estimateMetricsHeight(
                        block,
                        width,
                        densityTokens,
                        pageConfig
                    )
                );

            case 'tasks':
                return Math.max(
                    DEFAULT_BLOCK_MIN_HEIGHT.tasks,
                    estimateTasksHeight(
                        block,
                        densityTokens
                    )
                );

            case 'architecture':
                return Math.max(
                    DEFAULT_BLOCK_MIN_HEIGHT.architecture,
                    estimateArchitectureHeight(
                        block,
                        width,
                        densityTokens,
                        pageConfig
                    )
                );

            case 'insights':
            case 'decisions':
            case 'risks':
            case 'owners':
                return Math.max(
                    DEFAULT_BLOCK_MIN_HEIGHT[block.id],
                    estimateListHeight(
                        block,
                        width,
                        densityTokens
                    )
                );

            default:
                throw new LayoutError(
                    'UNSUPPORTED_BLOCK',
                    `No height estimator for block "${block.id}".`
                );
        }
    }

    function createPageRegions(pageConfig, hasStats) {
        const contentLeft = pageConfig.margin.left;
        const contentRight =
            pageConfig.width - pageConfig.margin.right;
        const contentWidth =
            contentRight - contentLeft;

        const header = {
            id: 'header',
            x: contentLeft,
            y: pageConfig.margin.top,
            width: contentWidth,
            height: pageConfig.headerHeight
        };

        const stats = hasStats
            ? {
                id: 'stats',
                x: contentLeft,
                y: header.y + header.height,
                width: contentWidth,
                height: pageConfig.statsHeight
            }
            : null;

        const footer = {
            id: 'footer',
            x: contentLeft,
            y:
                pageConfig.height -
                pageConfig.margin.bottom -
                pageConfig.footerHeight,
            width: contentWidth,
            height: pageConfig.footerHeight
        };

        const bodyTop = stats
            ? stats.y + stats.height + pageConfig.sectionGap
            : header.y + header.height + pageConfig.sectionGap;

        const bodyBottom =
            footer.y - pageConfig.sectionGap;

        const bodyHeight =
            bodyBottom - bodyTop;

        if (bodyHeight <= 0) {
            throw new LayoutError(
                'INVALID_PAGE_GEOMETRY',
                'Page service regions leave no positive body height.',
                {
                    pageConfig,
                    bodyTop,
                    bodyBottom
                }
            );
        }

        return {
            header,
            stats,
            body: {
                id: 'body',
                x: contentLeft,
                y: bodyTop,
                width: contentWidth,
                height: bodyHeight
            },
            footer
        };
    }

    function makeLayout(
        pageNumber,
        region,
        column,
        order,
        role,
        fits,
        geometry
    ) {
        return {
            pageNumber,
            region,
            column: column || null,
            order,
            role,
            fits,
            geometry: clone(geometry)
        };
    }

    function enrichBlock(
        block,
        pageNumber,
        region,
        column,
        order,
        role,
        fits,
        geometry
    ) {
        return {
            ...block,
            layout: makeLayout(
                pageNumber,
                region,
                column,
                order,
                role,
                fits,
                geometry
            )
        };
    }

    function appendServiceBlocks(blocks, regions, pageNumber) {
        const result = [];

        for (const block of blocks) {
            if (!SERVICE_IDS.has(block.id)) {
                continue;
            }

            const geometry =
                block.id === 'header'
                    ? regions.header
                    : block.id === 'stats'
                        ? regions.stats
                        : regions.footer;

            if (!geometry) {
                continue;
            }

            result.push(
                enrichBlock(
                    block,
                    pageNumber,
                    block.id,
                    null,
                    block.sourceIndex,
                    'service',
                    true,
                    geometry
                )
            );
        }

        return result;
    }

    function layoutVerticalFlow(blocks, region, context) {
        const positioned = [];
        const overflow = [];
        let cursorY = region.y;

        blocks.forEach((block, index) => {
            const width = region.width;
            const height = estimateBlockHeight(
                block,
                width,
                context
            );

            const remainingHeight =
                region.y + region.height - cursorY;

            const geometry = {
                x: region.x,
                y: cursorY,
                width,
                height
            };

            const fits =
                height <= remainingHeight + 0.001;

            const role = EXECUTIVE_IDS.has(block.id)
                ? 'executive'
                : 'supporting';

            const enriched = enrichBlock(
                block,
                context.pageNumber,
                'body',
                null,
                index,
                role,
                fits,
                geometry
            );

            if (fits) {
                positioned.push(enriched);
                cursorY +=
                    height + context.pageConfig.rowGap;
            } else {
                overflow.push({
                    ...enriched,
                    overflowBy: Math.max(
                        0,
                        height - remainingHeight
                    )
                });
            }
        });

        const usedHeight = positioned.length
            ? Math.max(
                0,
                cursorY -
                context.pageConfig.rowGap -
                region.y
            )
            : 0;

        return {
            positioned,
            overflow,
            usedHeight,
            availableHeight: region.height,
            columns: null
        };
    }

    function createColumnRegions(bodyRegion, pageConfig, templateConfig) {
        const gap = pageConfig.columnGap;
        const totalWidth = bodyRegion.width - gap;
        const dominantRatio =
            templateConfig.dominantRatio || 1;

        const leftWidth = templateConfig.dominantBlock
            ? totalWidth *
                dominantRatio /
                (1 + dominantRatio)
            : totalWidth / 2;

        const rightWidth =
            totalWidth - leftWidth;

        return {
            left: {
                id: 'body-left',
                x: bodyRegion.x,
                y: bodyRegion.y,
                width: leftWidth,
                height: bodyRegion.height
            },
            right: {
                id: 'body-right',
                x:
                    bodyRegion.x +
                    leftWidth +
                    gap,
                y: bodyRegion.y,
                width: rightWidth,
                height: bodyRegion.height
            }
        };
    }

    function measureColumnHeight(blocks, width, context) {
        if (blocks.length === 0) {
            return 0;
        }

        return blocks.reduce((total, block) => {
            return total +
                estimateBlockHeight(
                    block,
                    width,
                    context
                ) +
                context.pageConfig.rowGap;
        }, 0) - context.pageConfig.rowGap;
    }

    function splitBalanced(blocks, leftWidth, rightWidth, context) {
        const left = [];
        const right = [];
        let leftHeight = 0;
        let rightHeight = 0;

        for (const block of blocks) {
            const leftEstimate = estimateBlockHeight(
                block,
                leftWidth,
                context
            );

            const rightEstimate = estimateBlockHeight(
                block,
                rightWidth,
                context
            );

            if (leftHeight <= rightHeight) {
                left.push(block);
                leftHeight +=
                    leftEstimate +
                    context.pageConfig.rowGap;
            } else {
                right.push(block);
                rightHeight +=
                    rightEstimate +
                    context.pageConfig.rowGap;
            }
        }

        return {
            left,
            right,
            leftHeight,
            rightHeight
        };
    }

    function splitDominant(blocks, columns, context, dominantBlockId) {
        const dominant = blocks.filter(
            block => block.id === dominantBlockId
        );

        const rest = blocks.filter(
            block => block.id !== dominantBlockId
        );

        if (dominant.length === 0) {
            return splitBalanced(
                blocks,
                columns.left.width,
                columns.right.width,
                context
            );
        }

        const dominantHeight = measureColumnHeight(
            dominant,
            columns.left.width,
            context
        );

        const rightHeight = measureColumnHeight(
            rest,
            columns.right.width,
            context
        );

        return {
            left: dominant,
            right: rest,
            leftHeight: dominantHeight,
            rightHeight
        };
    }

    function layoutColumn(blocks, region, context, columnId) {
        const positioned = [];
        const overflow = [];
        let cursorY = region.y;

        blocks.forEach((block, index) => {
            const height = estimateBlockHeight(
                block,
                region.width,
                context
            );

            const remainingHeight =
                region.y + region.height - cursorY;

            const fits =
                height <= remainingHeight + 0.001;

            const geometry = {
                x: region.x,
                y: cursorY,
                width: region.width,
                height
            };

            const role = EXECUTIVE_IDS.has(block.id)
                ? 'executive'
                : 'supporting';

            const enriched = enrichBlock(
                block,
                context.pageNumber,
                'body',
                columnId,
                index,
                role,
                fits,
                geometry
            );

            if (fits) {
                positioned.push(enriched);
                cursorY +=
                    height + context.pageConfig.rowGap;
            } else {
                overflow.push({
                    ...enriched,
                    overflowBy: Math.max(
                        0,
                        height - remainingHeight
                    )
                });
            }
        });

        const usedHeight = positioned.length
            ? Math.max(
                0,
                cursorY -
                context.pageConfig.rowGap -
                region.y
            )
            : 0;

        return {
            positioned,
            overflow,
            usedHeight
        };
    }

    function layoutTwoColumns(blocks, bodyRegion, context, template) {
        const columns = createColumnRegions(
            bodyRegion,
            context.pageConfig,
            template.config
        );

        const split = template.config.dominantBlock
            ? splitDominant(
                blocks,
                columns,
                context,
                template.config.dominantBlock
            )
            : splitBalanced(
                blocks,
                columns.left.width,
                columns.right.width,
                context
            );

        const left = layoutColumn(
            split.left,
            columns.left,
            context,
            'left'
        );

        const right = layoutColumn(
            split.right,
            columns.right,
            context,
            'right'
        );

        return {
            positioned: [
                ...left.positioned,
                ...right.positioned
            ],
            overflow: [
                ...left.overflow,
                ...right.overflow
            ],
            usedHeight: Math.max(
                left.usedHeight,
                right.usedHeight
            ),
            availableHeight: bodyRegion.height,
            columns
        };
    }

    function findSideBySidePair(blocks) {
        const tasks = blocks.find(
            block => block.id === 'tasks'
        );

        const architecture = blocks.find(
            block => block.id === 'architecture'
        );

        if (!tasks || !architecture) {
            return null;
        }

        return {
            tasks,
            architecture
        };
    }

    function measureSideBySidePair(pair, bodyRegion, context) {
        const gap = context.pageConfig.columnGap;
        const width =
            (bodyRegion.width - gap) / 2;

        const tasksHeight = estimateBlockHeight(
            pair.tasks,
            width,
            context
        );

        const architectureHeight = estimateBlockHeight(
            pair.architecture,
            width,
            context
        );

        return {
            width,
            height: Math.max(
                tasksHeight,
                architectureHeight
            ),
            tasksHeight,
            architectureHeight
        };
    }

    function shouldUseSideBySide(pair, bodyRegion, context) {
        if (!pair) {
            return false;
        }

        const measurement = measureSideBySidePair(
            pair,
            bodyRegion,
            context
        );

        return measurement.height <=
            bodyRegion.height * 0.58;
    }

    function layoutSideBySidePair(
        pair,
        region,
        context,
        orderOffset
    ) {
        const gap = context.pageConfig.columnGap;
        const width =
            (region.width - gap) / 2;

        const tasksHeight = estimateBlockHeight(
            pair.tasks,
            width,
            context
        );

        const architectureHeight = estimateBlockHeight(
            pair.architecture,
            width,
            context
        );

        const sharedHeight = Math.max(
            tasksHeight,
            architectureHeight
        );

        const fits =
            sharedHeight <= region.height + 0.001;

        const tasksGeometry = {
            x: region.x,
            y: region.y,
            width,
            height: sharedHeight
        };

        const architectureGeometry = {
            x: region.x + width + gap,
            y: region.y,
            width,
            height: sharedHeight
        };

        const blocks = [
            enrichBlock(
                pair.tasks,
                context.pageNumber,
                'body',
                'left',
                orderOffset,
                'supporting',
                fits,
                tasksGeometry
            ),
            enrichBlock(
                pair.architecture,
                context.pageNumber,
                'body',
                'right',
                orderOffset + 1,
                'supporting',
                fits,
                architectureGeometry
            )
        ];

        return {
            positioned: fits ? blocks : [],
            overflow: fits
                ? []
                : blocks.map(block => ({
                    ...block,
                    overflowBy:
                        sharedHeight - region.height
                })),
            usedHeight: fits ? sharedHeight : 0,
            availableHeight: region.height
        };
    }

    function layoutAdaptive(blocks, regions, context, template) {
        const pair = findSideBySidePair(blocks);

        if (shouldUseSideBySide(pair, regions.body, context)) {
            const pairIds = new Set([
                'tasks',
                'architecture'
            ]);

            const upperBlocks = blocks.filter(
                block => !pairIds.has(block.id)
            );

            const pairMeasurement = measureSideBySidePair(
                pair,
                regions.body,
                context
            );

            const upperHeight = Math.max(
                0,
                regions.body.height -
                context.pageConfig.rowGap -
                pairMeasurement.height
            );

            const upperRegion = {
                ...regions.body,
                height: upperHeight
            };

            const upper = template.config.columns === 2
                ? layoutTwoColumns(
                    upperBlocks,
                    upperRegion,
                    context,
                    template
                )
                : layoutVerticalFlow(
                    upperBlocks,
                    upperRegion,
                    context
                );

            if (upper.overflow.length === 0) {
                const pairTop =
                    regions.body.y +
                    upper.usedHeight +
                    context.pageConfig.rowGap;

                const pairRegion = {
                    ...regions.body,
                    y: pairTop,
                    height: Math.max(
                        0,
                        regions.body.y +
                        regions.body.height -
                        pairTop
                    )
                };

                const sideBySide = layoutSideBySidePair(
                    pair,
                    pairRegion,
                    context,
                    upper.positioned.length
                );

                return {
                    positioned: [
                        ...upper.positioned,
                        ...sideBySide.positioned
                    ],
                    overflow: [
                        ...upper.overflow,
                        ...sideBySide.overflow
                    ],
                    usedHeight:
                        upper.usedHeight +
                        context.pageConfig.rowGap +
                        sideBySide.usedHeight,
                    availableHeight: regions.body.height,
                    columns: upper.columns || null
                };
            }
        }

        if (template.config.columns === 2) {
            return layoutTwoColumns(
                blocks,
                regions.body,
                context,
                template
            );
        }

        return layoutVerticalFlow(
            blocks,
            regions.body,
            context
        );
    }

    function nextDensity(current) {
        const order = [
            'regular',
            'compact',
            'dense',
            'truncated'
        ];

        const index = order.indexOf(current);

        return index >= 0 &&
            index < order.length - 1
            ? order[index + 1]
            : null;
    }

    function layoutWithDensityFallback(
        blocks,
        regions,
        baseContext,
        template,
        options
    ) {
        let context = baseContext;

        let flow = layoutAdaptive(
            blocks,
            regions,
            context,
            template
        );

        const attempted = [context.density];

        while (
            flow.overflow.length > 0 &&
            options?.enableDensityFallback !== false
        ) {
            const next = nextDensity(context.density);

            if (!next) {
                break;
            }

            context = {
                ...context,
                density: next,
                densityTokens: resolveDensityTokens(
                    next,
                    options
                )
            };

            attempted.push(next);

            flow = layoutAdaptive(
                blocks,
                regions,
                context,
                template
            );
        }

        return {
            ...flow,
            density: context.density,
            densityTokens: context.densityTokens,
            densityFallback: {
                applied: attempted.length > 1,
                attempted
            }
        };
    }

    function rectanglesIntersect(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    function validateGeometry(pageResult) {
        const errors = [];
        const warnings = [];
        const {
            width,
            height
        } = pageResult.size;

        for (const block of pageResult.blocks) {
            const geometry =
                block.layout?.geometry;

            if (
                !geometry ||
                ![
                    geometry.x,
                    geometry.y,
                    geometry.width,
                    geometry.height
                ].every(Number.isFinite)
            ) {
                errors.push({
                    code: 'INVALID_GEOMETRY',
                    blockId: block.id
                });
                continue;
            }

            if (
                geometry.width <= 0 ||
                geometry.height <= 0
            ) {
                errors.push({
                    code: 'NON_POSITIVE_GEOMETRY',
                    blockId: block.id,
                    geometry
                });
            }

            if (
                geometry.x < 0 ||
                geometry.y < 0 ||
                geometry.x + geometry.width > width + 0.001 ||
                geometry.y + geometry.height > height + 0.001
            ) {
                errors.push({
                    code: 'OUT_OF_PAGE',
                    blockId: block.id,
                    geometry
                });
            }
        }

        const bodyBlocks = pageResult.blocks.filter(
            block => block.layout?.region === 'body'
        );

        for (
            let first = 0;
            first < bodyBlocks.length;
            first += 1
        ) {
            for (
                let second = first + 1;
                second < bodyBlocks.length;
                second += 1
            ) {
                const a = bodyBlocks[first];
                const b = bodyBlocks[second];

                if (
                    rectanglesIntersect(
                        a.layout.geometry,
                        b.layout.geometry
                    )
                ) {
                    errors.push({
                        code: 'BLOCK_INTERSECTION',
                        blockIds: [
                            a.id,
                            b.id
                        ]
                    });
                }
            }
        }

        if (pageResult.overflow.length > 0) {
            warnings.push({
                code: 'PAGE_OVERFLOW',
                blockIds: pageResult.overflow.map(
                    block => block.id
                )
            });
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    function assertUniqueBlockIds(blocks, pageIndex) {
        const seen = new Set();

        for (const block of blocks) {
            if (seen.has(block.id)) {
                throw new LayoutError(
                    'DUPLICATE_BLOCK_ID',
                    `Page ${pageIndex + 1} contains duplicate block "${block.id}".`,
                    {
                        pageIndex,
                        blockId: block.id
                    }
                );
            }

            seen.add(block.id);
        }
    }

    function layoutPage(
        rawPage,
        pageIndex,
        pageCount,
        composition,
        options
    ) {
        const page = assertCompositionPage(
            rawPage,
            pageIndex
        );

        const blocks = page.blocks.map(
            (block, blockIndex) =>
                assertCompositionBlock(
                    block,
                    blockIndex,
                    pageIndex
                )
        );

        assertUniqueBlockIds(blocks, pageIndex);

        const pageConfig = normalizePageConfig(options);

        const hasStats = blocks.some(
            block => block.id === 'stats'
        );

        const regions = createPageRegions(
            pageConfig,
            hasStats
        );

        const requestedDensity = resolveDensity(
            page,
            composition,
            options
        );

        const densityTokens = resolveDensityTokens(
            requestedDensity,
            options
        );

        const template = resolveTemplate(page);

        const context = {
            pageConfig,
            density: requestedDensity,
            densityTokens,
            pageNumber: page.number || pageIndex + 1,
            pageCount
        };

        const bodyBlocks = blocks.filter(
            block => !SERVICE_IDS.has(block.id)
        );

        const flow = layoutWithDensityFallback(
            bodyBlocks,
            regions,
            context,
            template,
            options
        );

        const serviceBlocks = appendServiceBlocks(
            blocks,
            regions,
            context.pageNumber
        );

        const laidOutBlocks = [
            ...serviceBlocks,
            ...flow.positioned
        ].sort(
            (a, b) =>
                a.sourceIndex - b.sourceIndex
        );

        const result = {
            id: page.id || `page-${pageIndex + 1}`,
            number: context.pageNumber,
            index: pageIndex,
            pageCount,
            continuation: Boolean(
                page.continuation ||
                pageIndex > 0
            ),
            requestedDensity,
            density: flow.density,
            template,
            size: {
                width: pageConfig.width,
                height: pageConfig.height
            },
            regions: flow.columns
                ? {
                    ...regions,
                    columns: flow.columns
                }
                : regions,
            blocks: laidOutBlocks,
            overflow: flow.overflow,
            metrics: {
                bodyUsedHeight: flow.usedHeight,
                bodyAvailableHeight: flow.availableHeight,
                bodyUtilization:
                    flow.availableHeight > 0
                        ? flow.usedHeight /
                            flow.availableHeight
                        : 0,
                placedBlocks: flow.positioned.length,
                serviceBlocks: serviceBlocks.length,
                overflowBlocks: flow.overflow.length,
                densityFallback:
                    flow.densityFallback
            }
        };

        result.validation =
            validateGeometry(result);

        return result;
    }

    function layout(compositionResult, options) {
        const safeOptions = isPlainObject(options)
            ? options
            : {};

        const pages = extractCompositionPages(
            compositionResult
        );

        const layoutPages = pages.map(
            (page, index) =>
                layoutPage(
                    page,
                    index,
                    pages.length,
                    compositionResult,
                    safeOptions
                )
        );

        const errors = layoutPages.flatMap(
            page =>
                page.validation.errors.map(
                    error => ({
                        page: page.number,
                        ...error
                    })
                )
        );

        const warnings = layoutPages.flatMap(
            page =>
                page.validation.warnings.map(
                    warning => ({
                        page: page.number,
                        ...warning
                    })
                )
        );

        const deferredTemplates = layoutPages
            .filter(page => page.template.deferred)
            .map(page => ({
                page: page.number,
                requested: page.template.requested,
                applied: page.template.applied
            }));

        if (deferredTemplates.length > 0) {
            warnings.push({
                code: 'UNKNOWN_TEMPLATE_FALLBACK',
                templates: deferredTemplates
            });
        }

        const result = {
            engine: {
                name: ENGINE_NAME,
                version: ENGINE_VERSION
            },
            pageCount: layoutPages.length,
            pages: layoutPages,
            valid: errors.length === 0,
            diagnostics: {
                errors,
                warnings,
                overflow: layoutPages.flatMap(
                    page =>
                        page.overflow.map(
                            block => ({
                                page: page.number,
                                blockId: block.id,
                                overflowBy:
                                    block.overflowBy
                            })
                        )
                )
            }
        };

        if (
            safeOptions.throwOnValidationError &&
            !result.valid
        ) {
            throw new LayoutError(
                'LAYOUT_VALIDATION_FAILED',
                'LayoutResult contains validation errors.',
                result.diagnostics
            );
        }

        return result;
    }

    const publicApi = Object.freeze({
        name: ENGINE_NAME,
        version: ENGINE_VERSION,
        layout,
        LayoutError,
        defaults: Object.freeze({
            page: DEFAULT_PAGE,
            density: DEFAULT_DENSITY,
            minimumBlockHeight:
                DEFAULT_BLOCK_MIN_HEIGHT
        }),
        contracts: Object.freeze({
            blockIds: BLOCK_IDS.slice(),
            templates: Object.keys(TEMPLATE_CONFIG)
        })
    });

    globalScope[ENGINE_NAME] = publicApi;

    if (
        typeof module !== 'undefined' &&
        module.exports
    ) {
        module.exports = publicApi;
    }
})(
    typeof globalThis !== 'undefined'
        ? globalThis
        : typeof window !== 'undefined'
            ? window
            : this
);
