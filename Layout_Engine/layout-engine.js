/**
 * MeetMind Executive PDF Engine
 * Layout Engine — Release 0.2 / Iteration 1
 *
 * Responsibility:
 *   Convert a CompositionResult into deterministic page geometry.
 *
 * Explicitly out of scope:
 *   - report_json normalization
 *   - visibility decisions
 *   - business priority
 *   - pagination decisions
 *   - text rendering
 *   - PDF drawing
 *
 * Browser usage:
 *   const result = MeetMindLayoutEngine.layout(compositionResult, options);
 *
 * ES module usage is intentionally not required for the MVP.
 */
(function attachMeetMindLayoutEngine(globalScope) {
    'use strict';

    const ENGINE_NAME = 'MeetMindLayoutEngine';
    const ENGINE_VERSION = '0.3.0';

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

    const EXECUTIVE_IDS = new Set([
        'summary',
        'metrics',
        'insights',
        'decisions',
        'risks'
    ]);

    const SERVICE_IDS = new Set([
        'header',
        'stats',
        'footer'
    ]);


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
        return JSON.parse(JSON.stringify(value));
    }

    function normalizeId(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[\s_]+/g, '-');
    }

    function canonicalBlockId(value) {
        const id = normalizeId(value);
        const aliases = {
            'meeting-statistics': 'stats',
            'meeting-stats': 'stats',
            'executive-summary': 'summary',
            'key-metrics': 'metrics',
            'responsibles': 'owners',
            'responsible': 'owners'
        };
        return aliases[id] || id;
    }

    function resolveDensity(page, composition, options) {
        const raw = (
            page?.density ||
            composition?.density ||
            options?.density ||
            'regular'
        );
        const density = normalizeId(raw);
        return DEFAULT_DENSITY[density] ? density : 'regular';
    }

    function normalizePageConfig(options) {
        const source = isPlainObject(options?.page) ? options.page : {};
        const marginSource = isPlainObject(source.margin) ? source.margin : {};

        const margin = {
            top: finiteNumber(marginSource.top, DEFAULT_PAGE.margin.top),
            right: finiteNumber(marginSource.right, DEFAULT_PAGE.margin.right),
            bottom: finiteNumber(marginSource.bottom, DEFAULT_PAGE.margin.bottom),
            left: finiteNumber(marginSource.left, DEFAULT_PAGE.margin.left)
        };

        return {
            width: positiveNumber(source.width, DEFAULT_PAGE.width),
            height: positiveNumber(source.height, DEFAULT_PAGE.height),
            margin,
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
            rowGap: finiteNumber(source.rowGap, DEFAULT_PAGE.rowGap),
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

    return composition.pages;
}

    function extractPageBlocks(page) {
        if (Array.isArray(page?.blocks)) {
            return page.blocks;
        }
        if (Array.isArray(page?.sections)) {
            return page.sections;
        }
        if (Array.isArray(page?.items)) {
            return page.items;
        }
        return [];
    }

    function normalizeBlock(rawBlock, index) {
        if (!isPlainObject(rawBlock)) {
            throw new LayoutError(
                'INVALID_BLOCK',
                `Block at index ${index} must be an object.`,
                { index, rawBlock }
            );
        }

        const id = canonicalBlockId(
            rawBlock.id ||
            rawBlock.type ||
            rawBlock.blockId ||
            rawBlock.key
        );

        if (!id) {
            throw new LayoutError(
                'MISSING_BLOCK_ID',
                `Block at index ${index} has no id/type.`,
                { index, rawBlock }
            );
        }

        const data =
            rawBlock.data ??
            rawBlock.content ??
            rawBlock.payload ??
            rawBlock.value ??
            null;

        return {
            ...rawBlock,
            id,
            type: canonicalBlockId(rawBlock.type || id),
            data,
            layoutHint: isPlainObject(rawBlock.layoutHint)
                ? rawBlock.layoutHint
                : {},
            sourceIndex: index
        };
    }

    function estimateTextLines(text, width, densityTokens) {
        const value = String(text || '').trim();
        if (!value) {
            return 0;
        }

        // Deterministic approximation. Renderer remains responsible for
        // measuring exact glyphs during the integration iteration.
        const averageCharacterWidth = densityTokens.lineHeight * 0.43;
        const charactersPerLine = Math.max(
            12,
            Math.floor(width / averageCharacterWidth)
        );

        return value
            .split(/\n+/)
            .reduce((total, paragraph) => {
                const length = Math.max(1, paragraph.trim().length);
                return total + Math.ceil(length / charactersPerLine);
            }, 0);
    }

    function arrayFromBlock(block) {
        const candidates = [
            block.items,
            block.rows,
            block.data,
            block.data?.items,
            block.data?.rows,
            block.data?.sections
        ];

        for (const candidate of candidates) {
            if (Array.isArray(candidate)) {
                return candidate;
            }
        }
        return [];
    }

    function textFromBlock(block) {
        const candidates = [
            block.text,
            block.summary,
            block.description,
            block.details,
            block.data,
            block.data?.text,
            block.data?.summary,
            block.data?.description
        ];

        for (const candidate of candidates) {
            if (typeof candidate === 'string' && candidate.trim()) {
                return candidate;
            }
        }
        return '';
    }

    function estimateListHeight(block, width, densityTokens) {
        const items = arrayFromBlock(block);
        const bodyWidth = Math.max(
            80,
            width - densityTokens.blockPadding * 2
        );

        const itemsHeight = items.reduce((total, item) => {
            if (typeof item === 'string') {
                const lines = Math.max(
                    1,
                    estimateTextLines(item, bodyWidth, densityTokens)
                );
                return total +
                    lines * densityTokens.lineHeight +
                    densityTokens.itemGap;
            }

            const title =
                item?.title ||
                item?.name ||
                item?.item ||
                item?.task ||
                '';
            const details =
                item?.details ||
                item?.description ||
                item?.text ||
                item?.responsibility ||
                '';

            const titleLines = Math.max(
                1,
                estimateTextLines(title, bodyWidth, densityTokens)
            );
            const detailLines = estimateTextLines(
                details,
                bodyWidth,
                densityTokens
            );

            return total +
                (titleLines + detailLines) * densityTokens.lineHeight +
                densityTokens.itemGap;
        }, 0);

        return densityTokens.blockPadding * 2 +
            densityTokens.sectionTitleHeight +
            itemsHeight;
    }

    function estimateSummaryHeight(block, width, densityTokens) {
        const text = textFromBlock(block);
        const bodyWidth = Math.max(
            80,
            width - densityTokens.blockPadding * 2
        );
        const lines = Math.max(
            2,
            estimateTextLines(text, bodyWidth, densityTokens)
        );

        return densityTokens.blockPadding * 2 +
            densityTokens.sectionTitleHeight +
            lines * densityTokens.lineHeight;
    }

    function estimateMetricsHeight(block, width, densityTokens) {
        const metrics = arrayFromBlock(block);
        const count = Math.max(1, metrics.length);
        const minimumCardWidth = 150;
        const columns = Math.max(
            1,
            Math.floor(
                (width + DEFAULT_PAGE.columnGap) /
                (minimumCardWidth + DEFAULT_PAGE.columnGap)
            )
        );
        const rows = Math.ceil(count / columns);

        return densityTokens.blockPadding * 2 +
            densityTokens.sectionTitleHeight +
            rows * densityTokens.metricHeight +
            Math.max(0, rows - 1) * densityTokens.itemGap;
    }

    function estimateTasksHeight(block, width, densityTokens) {
        const rows = arrayFromBlock(block);
        const rowCount = Math.max(1, rows.length);

        return densityTokens.blockPadding * 2 +
            densityTokens.sectionTitleHeight +
            densityTokens.tableHeaderHeight +
            rowCount * densityTokens.tableRowHeight;
    }

    function estimateArchitectureHeight(block, width, densityTokens) {
        const sections = arrayFromBlock(block);
        let cards = 0;

        for (const section of sections) {
            if (Array.isArray(section?.items)) {
                cards += section.items.length;
            } else {
                cards += 1;
            }
        }

        cards = Math.max(1, cards);
        const minimumCardWidth = 210;
        const columns = Math.max(
            1,
            Math.min(
                4,
                Math.floor(
                    (width + DEFAULT_PAGE.columnGap) /
                    (minimumCardWidth + DEFAULT_PAGE.columnGap)
                )
            )
        );
        const rows = Math.ceil(cards / columns);

        return densityTokens.blockPadding * 2 +
            densityTokens.sectionTitleHeight +
            rows * densityTokens.architectureCardHeight +
            Math.max(0, rows - 1) * densityTokens.itemGap;
    }

    function estimateBlockHeight(block, width, context) {
        const { pageConfig, densityTokens } = context;
        const explicitHeight =
            block.layoutHint?.height ??
            block.estimatedHeight ??
            block.height;

        if (Number.isFinite(explicitHeight) && explicitHeight > 0) {
            return explicitHeight;
        }

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
                    estimateSummaryHeight(block, width, densityTokens)
                );
            case 'metrics':
                return Math.max(
                    DEFAULT_BLOCK_MIN_HEIGHT.metrics,
                    estimateMetricsHeight(block, width, densityTokens)
                );
            case 'tasks':
                return Math.max(
                    DEFAULT_BLOCK_MIN_HEIGHT.tasks,
                    estimateTasksHeight(block, width, densityTokens)
                );
            case 'architecture':
                return Math.max(
                    DEFAULT_BLOCK_MIN_HEIGHT.architecture,
                    estimateArchitectureHeight(
                        block,
                        width,
                        densityTokens
                    )
                );
            case 'insights':
            case 'decisions':
            case 'risks':
            case 'owners':
                return Math.max(
                    DEFAULT_BLOCK_MIN_HEIGHT[block.id] || 80,
                    estimateListHeight(block, width, densityTokens)
                );
            default: {
                const text = textFromBlock(block);
                if (text) {
                    return Math.max(
                        68,
                        estimateSummaryHeight(
                            block,
                            width,
                            densityTokens
                        )
                    );
                }
                const items = arrayFromBlock(block);
                if (items.length) {
                    return Math.max(
                        68,
                        estimateListHeight(block, width, densityTokens)
                    );
                }
                return 68;
            }
        }
    }

    function createPageRegions(pageConfig, hasStats) {
        const contentLeft = pageConfig.margin.left;
        const contentRight = pageConfig.width - pageConfig.margin.right;
        const contentWidth = contentRight - contentLeft;

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
            y: pageConfig.height -
                pageConfig.margin.bottom -
                pageConfig.footerHeight,
            width: contentWidth,
            height: pageConfig.footerHeight
        };

        const bodyTop = stats
            ? stats.y + stats.height + pageConfig.sectionGap
            : header.y + header.height + pageConfig.sectionGap;

        const bodyBottom = footer.y - pageConfig.sectionGap;

        return {
            header,
            stats,
            body: {
                id: 'body',
                x: contentLeft,
                y: bodyTop,
                width: contentWidth,
                height: Math.max(0, bodyBottom - bodyTop)
            },
            footer
        };
    }

    function resolveTemplate(page, normalizedBlocks) {
        const raw =
            page?.template ||
            page?.layoutTemplate ||
            page?.composition ||
            'vertical-flow';

        const requested = normalizeId(raw) || 'vertical-flow';
        const aliases = {
            'dominant-insight': 'dominant-insights',
            'dominant-decision': 'dominant-decisions',
            'dominant-risk': 'dominant-risks'
        };
        const normalized = aliases[requested] || requested;
        const applied = TEMPLATE_CONFIG[normalized]
            ? normalized
            : 'vertical-flow';

        return {
            requested,
            applied,
            deferred: requested !== applied,
            config: TEMPLATE_CONFIG[applied]
        };
    }

    function geometryForServiceBlock(block, regions) {
        if (block.id === 'header') {
            return regions.header;
        }
        if (block.id === 'stats') {
            return regions.stats;
        }
        if (block.id === 'footer') {
            return regions.footer;
        }
        return null;
    }

    function layoutVerticalFlow(blocks, regions, context) {
        const bodyBlocks = blocks.filter(block => !SERVICE_IDS.has(block.id));
        const positioned = [];
        const overflow = [];
        let cursorY = regions.body.y;

        bodyBlocks.forEach((block, index) => {
            const width = regions.body.width;
            const height = estimateBlockHeight(block, width, context);
            const remainingHeight =
                regions.body.y + regions.body.height - cursorY;

            const geometry = {
                x: regions.body.x,
                y: cursorY,
                width,
                height
            };

            const fits = height <= remainingHeight + 0.001;

            const positionedBlock = {
                ...block,
                geometry,
                fits,
                region: 'body',
                order: index,
                role: EXECUTIVE_IDS.has(block.id)
                    ? 'executive'
                    : 'supporting'
            };

            if (fits) {
                positioned.push(positionedBlock);
                cursorY += height + context.pageConfig.rowGap;
            } else {
                overflow.push({
                    ...positionedBlock,
                    overflowBy: Math.max(0, height - remainingHeight)
                });
            }
        });

        return {
            positioned,
            overflow,
            usedHeight: positioned.length
                ? Math.max(
                    0,
                    cursorY -
                    context.pageConfig.rowGap -
                    regions.body.y
                )
                : 0,
            availableHeight: regions.body.height
        };
    }


    function splitByHeight(blocks, width, availableHeight, context) {
        const left = [];
        const right = [];
        let leftHeight = 0;
        let rightHeight = 0;

        for (const block of blocks) {
            const estimated = estimateBlockHeight(block, width, context);
            const target = leftHeight <= rightHeight ? left : right;

            target.push(block);
            if (target === left) {
                leftHeight += estimated + context.pageConfig.rowGap;
            } else {
                rightHeight += estimated + context.pageConfig.rowGap;
            }
        }

        return { left, right, leftHeight, rightHeight };
    }

    function layoutColumn(blocks, region, context, columnId) {
        const positioned = [];
        const overflow = [];
        let cursorY = region.y;

        blocks.forEach((block, index) => {
            const height = estimateBlockHeight(block, region.width, context);
            const remainingHeight =
                region.y + region.height - cursorY;
            const fits = height <= remainingHeight + 0.001;

            const positionedBlock = {
                ...block,
                geometry: {
                    x: region.x,
                    y: cursorY,
                    width: region.width,
                    height
                },
                fits,
                region: 'body',
                column: columnId,
                order: index,
                role: EXECUTIVE_IDS.has(block.id)
                    ? 'executive'
                    : 'supporting'
            };

            if (fits) {
                positioned.push(positionedBlock);
                cursorY += height + context.pageConfig.rowGap;
            } else {
                overflow.push({
                    ...positionedBlock,
                    overflowBy: Math.max(0, height - remainingHeight)
                });
            }
        });

        return {
            positioned,
            overflow,
            usedHeight: positioned.length
                ? cursorY - context.pageConfig.rowGap - region.y
                : 0
        };
    }

    function createColumnRegions(bodyRegion, pageConfig, templateConfig) {
        const gap = pageConfig.columnGap;
        const totalWidth = bodyRegion.width - gap;
        const dominantRatio = templateConfig.dominantRatio || 1;

        const leftWidth = templateConfig.dominantBlock
            ? totalWidth * dominantRatio / (1 + dominantRatio)
            : totalWidth / 2;
        const rightWidth = totalWidth - leftWidth;

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
                x: bodyRegion.x + leftWidth + gap,
                y: bodyRegion.y,
                width: rightWidth,
                height: bodyRegion.height
            }
        };
    }

    function prioritizeDominantBlock(blocks, dominantBlock) {
        if (!dominantBlock) {
            return blocks;
        }

        const dominant = [];
        const rest = [];
        for (const block of blocks) {
            if (block.id === dominantBlock) {
                dominant.push(block);
            } else {
                rest.push(block);
            }
        }
        return [...dominant, ...rest];
    }

    function findSideBySidePair(blocks) {
        const tasksIndex = blocks.findIndex(block => block.id === 'tasks');
        const architectureIndex = blocks.findIndex(
            block => block.id === 'architecture'
        );

        if (tasksIndex === -1 || architectureIndex === -1) {
            return null;
        }

        return {
            tasks: blocks[tasksIndex],
            architecture: blocks[architectureIndex],
            firstIndex: Math.min(tasksIndex, architectureIndex)
        };
    }

    function shouldUseSideBySide(pair, bodyRegion, context) {
        if (!pair) {
            return false;
        }

        const halfWidth =
            (bodyRegion.width - context.pageConfig.columnGap) / 2;
        const tasksHeight = estimateBlockHeight(
            pair.tasks,
            halfWidth,
            context
        );
        const architectureHeight = estimateBlockHeight(
            pair.architecture,
            halfWidth,
            context
        );

        return Math.max(tasksHeight, architectureHeight) <=
            bodyRegion.height * 0.58;
    }

    function layoutSideBySidePair(pair, bodyRegion, context) {
        const gap = context.pageConfig.columnGap;
        const width = (bodyRegion.width - gap) / 2;
        const tasksHeight = estimateBlockHeight(pair.tasks, width, context);
        const architectureHeight = estimateBlockHeight(
            pair.architecture,
            width,
            context
        );
        const height = Math.max(tasksHeight, architectureHeight);

        return {
            blocks: [
                {
                    ...pair.tasks,
                    geometry: {
                        x: bodyRegion.x,
                        y: bodyRegion.y,
                        width,
                        height
                    },
                    fits: height <= bodyRegion.height,
                    region: 'body',
                    column: 'left',
                    order: 0,
                    role: 'supporting'
                },
                {
                    ...pair.architecture,
                    geometry: {
                        x: bodyRegion.x + width + gap,
                        y: bodyRegion.y,
                        width,
                        height
                    },
                    fits: height <= bodyRegion.height,
                    region: 'body',
                    column: 'right',
                    order: 1,
                    role: 'supporting'
                }
            ],
            usedHeight: height,
            overflow: height <= bodyRegion.height ? [] : [
                {
                    id: 'tasks-architecture-pair',
                    overflowBy: height - bodyRegion.height
                }
            ]
        };
    }

    function layoutAdaptive(blocks, regions, context, template) {
        const bodyBlocks = blocks.filter(block => !SERVICE_IDS.has(block.id));
        const pair = findSideBySidePair(bodyBlocks);

        if (shouldUseSideBySide(pair, regions.body, context)) {
            const pairIds = new Set(['tasks', 'architecture']);
            const upperBlocks = bodyBlocks.filter(
                block => !pairIds.has(block.id)
            );
            const upperAvailable = Math.max(
                0,
                regions.body.height -
                context.pageConfig.rowGap -
                regions.body.height * 0.42
            );
            const upperRegion = {
                ...regions.body,
                height: upperAvailable
            };

            const upper = template.config.columns === 2
                ? layoutTwoColumns(
                    upperBlocks,
                    upperRegion,
                    context,
                    template
                )
                : layoutVerticalFlow(
                    [...upperBlocks],
                    upperRegion,
                    context
                );

            const pairTop = regions.body.y +
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
                context
            );

            return {
                positioned: [
                    ...upper.positioned,
                    ...sideBySide.blocks
                ],
                overflow: [
                    ...upper.overflow,
                    ...sideBySide.overflow
                ],
                usedHeight:
                    upper.usedHeight +
                    context.pageConfig.rowGap +
                    sideBySide.usedHeight,
                availableHeight: regions.body.height
            };
        }

        if (template.config.columns === 2) {
            return layoutTwoColumns(
                bodyBlocks,
                regions.body,
                context,
                template
            );
        }

        return layoutVerticalFlow(blocks, regions, context);
    }

    function layoutTwoColumns(blocks, bodyRegion, context, template) {
        const columns = createColumnRegions(
            bodyRegion,
            context.pageConfig,
            template.config
        );
        const ordered = prioritizeDominantBlock(
            blocks,
            template.config.dominantBlock
        );

        let leftBlocks = [];
        let rightBlocks = [];

        if (template.config.dominantBlock) {
            leftBlocks = ordered.filter(
                block => block.id === template.config.dominantBlock
            );
            const rest = ordered.filter(
                block => block.id !== template.config.dominantBlock
            );
            const split = splitByHeight(
                rest,
                columns.right.width,
                bodyRegion.height,
                context
            );

            rightBlocks = [...split.left, ...split.right];
        } else {
            const split = splitByHeight(
                ordered,
                columns.left.width,
                bodyRegion.height,
                context
            );
            leftBlocks = split.left;
            rightBlocks = split.right;
        }

        const left = layoutColumn(
            leftBlocks,
            columns.left,
            context,
            'left'
        );
        const right = layoutColumn(
            rightBlocks,
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
            usedHeight: Math.max(left.usedHeight, right.usedHeight),
            availableHeight: bodyRegion.height,
            columns
        };
    }

    function nextDensity(current) {
        const order = ['regular', 'compact', 'dense', 'truncated'];
        const index = order.indexOf(current);
        return index >= 0 && index < order.length - 1
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
        let flow = layoutAdaptive(blocks, regions, context, template);
        const attempted = [context.density];

        while (
            flow.overflow.length &&
            options?.enableDensityFallback !== false
        ) {
            const next = nextDensity(context.density);
            if (!next) {
                break;
            }

            context = {
                ...context,
                density: next,
                densityTokens: {
                    ...DEFAULT_DENSITY[next],
                    ...(isPlainObject(options?.densityTokens?.[next])
                        ? options.densityTokens[next]
                        : {})
                }
            };
            attempted.push(next);
            flow = layoutAdaptive(blocks, regions, context, template);
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

    function appendServiceBlocks(blocks, regions, pageNumber) {
        const result = [];

        for (const block of blocks) {
            if (!SERVICE_IDS.has(block.id)) {
                continue;
            }

            const geometry = geometryForServiceBlock(block, regions);
            if (!geometry) {
                continue;
            }

            result.push({
                ...block,
                geometry: clone(geometry),
                fits: true,
                region: block.id,
                order: block.sourceIndex,
                role: 'service',
                pageNumber
            });
        }

        return result;
    }

    function validateGeometry(pageResult) {
        const errors = [];
        const warnings = [];
        const { width, height } = pageResult.size;
        const blocks = pageResult.blocks;

        for (const block of blocks) {
            const g = block.geometry;
            if (!g ||
                ![g.x, g.y, g.width, g.height].every(Number.isFinite)) {
                errors.push({
                    code: 'INVALID_GEOMETRY',
                    blockId: block.id
                });
                continue;
            }

            if (g.width <= 0 || g.height <= 0) {
                errors.push({
                    code: 'NON_POSITIVE_GEOMETRY',
                    blockId: block.id,
                    geometry: g
                });
            }

            if (g.x < 0 ||
                g.y < 0 ||
                g.x + g.width > width + 0.001 ||
                g.y + g.height > height + 0.001) {
                errors.push({
                    code: 'OUT_OF_PAGE',
                    blockId: block.id,
                    geometry: g
                });
            }
        }

        const bodyBlocks = blocks.filter(block => block.region === 'body');
        for (let i = 0; i < bodyBlocks.length; i += 1) {
            for (let j = i + 1; j < bodyBlocks.length; j += 1) {
                const a = bodyBlocks[i];
                const b = bodyBlocks[j];
                const intersects =
                    a.geometry.x < b.geometry.x + b.geometry.width &&
                    a.geometry.x + a.geometry.width > b.geometry.x &&
                    a.geometry.y < b.geometry.y + b.geometry.height &&
                    a.geometry.y + a.geometry.height > b.geometry.y;

                if (intersects) {
                    errors.push({
                        code: 'BLOCK_INTERSECTION',
                        blockIds: [a.id, b.id]
                    });
                }
            }
        }

        if (pageResult.overflow.length) {
            warnings.push({
                code: 'PAGE_OVERFLOW',
                blockIds: pageResult.overflow.map(block => block.id)
            });
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    function layoutPage(rawPage, pageIndex, pageCount, composition, options) {
        const pageConfig = normalizePageConfig(options);
        const rawBlocks = extractPageBlocks(rawPage);
        const blocks = rawBlocks.map(normalizeBlock);

        const hasStats = blocks.some(block => block.id === 'stats');
        const regions = createPageRegions(pageConfig, hasStats);
        const density = resolveDensity(rawPage, composition, options);
        const densityTokens = {
            ...DEFAULT_DENSITY[density],
            ...(isPlainObject(options?.densityTokens?.[density])
                ? options.densityTokens[density]
                : {})
        };

        const template = resolveTemplate(rawPage, blocks);
        const context = {
            pageConfig,
            density,
            densityTokens,
            pageNumber: pageIndex + 1,
            pageCount
        };

        const flow = layoutWithDensityFallback(
            blocks,
            regions: flow.columns
                ? {
                    ...regions,
                    columns: flow.columns
                }
                : regions,
            context,
            template,
            options
        );
        const serviceBlocks = appendServiceBlocks(
            blocks,
            regions: flow.columns
                ? {
                    ...regions,
                    columns: flow.columns
                }
                : regions,
            pageIndex + 1
        );

        const bodyBlocks = flow.positioned.map(block => ({
            ...block,
            pageNumber: pageIndex + 1
        }));

        const result = {
            id: rawPage?.id || `page-${pageIndex + 1}`,
            number: rawPage?.number || pageIndex + 1,
            index: pageIndex,
            pageCount,
            continuation: Boolean(
                rawPage?.continuation ||
                pageIndex > 0
            ),
            density: flow.density,
            requestedDensity: density,
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
            blocks: [...serviceBlocks, ...bodyBlocks].sort(
                (a, b) => a.sourceIndex - b.sourceIndex
            ),
            overflow: flow.overflow,
            metrics: {
                bodyUsedHeight: flow.usedHeight,
                bodyAvailableHeight: flow.availableHeight,
                bodyUtilization: flow.availableHeight > 0
                    ? flow.usedHeight / flow.availableHeight
                    : 0,
                placedBlocks: bodyBlocks.length,
                overflowBlocks: flow.overflow.length,
                densityFallback: flow.densityFallback
            }
        };

        result.validation = validateGeometry(result);
        return result;
    }

    function layout(compositionResult, options) {
        const safeOptions = isPlainObject(options) ? options : {};
        const pages = extractCompositionPages(compositionResult);
        const layoutPages = pages.map((page, index) =>
            layoutPage(
                page,
                index,
                pages.length,
                compositionResult,
                safeOptions
            )
        );

        const errors = layoutPages.flatMap(page =>
            page.validation.errors.map(error => ({
                page: page.number,
                ...error
            }))
        );

        const warnings = layoutPages.flatMap(page =>
            page.validation.warnings.map(warning => ({
                page: page.number,
                ...warning
            }))
        );

        const deferredTemplates = layoutPages
            .filter(page => page.template.deferred)
            .map(page => ({
                page: page.number,
                requested: page.template.requested,
                applied: page.template.applied
            }));

        if (deferredTemplates.length) {
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
                overflow: layoutPages.flatMap(page =>
                    page.overflow.map(block => ({
                        page: page.number,
                        blockId: block.id,
                        overflowBy: block.overflowBy
                    }))
                )
            }
        };

        if (safeOptions.throwOnValidationError && !result.valid) {
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
            minimumBlockHeight: DEFAULT_BLOCK_MIN_HEIGHT
        })
    });

    globalScope[ENGINE_NAME] = publicApi;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = publicApi;
    }
})(
    typeof globalThis !== 'undefined'
        ? globalThis
        : typeof window !== 'undefined'
            ? window
            : this
);
