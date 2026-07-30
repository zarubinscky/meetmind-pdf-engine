/*
 * MeetMind AI — Executive Slide Engine
 * insights-renderer.js
 *
 * Version: 1.0.0
 * Status: Implementation candidate
 */
(function initializeInsightsRenderer(globalScope) {
    'use strict';

    const MODULE_NAME = 'InsightsRenderer';
    const VERSION = '1.0.0';
    const RENDERER_ID = 'insights';
    const engine = globalScope.ExecutiveSlideEngine || {};

    function renderInsights(block, pageContext) {
        validateBlock(block);
        validateContext(pageContext);

        const report = pageContext.getReport();
        const tokens = pageContext.getDesignTokens();
        const items = normalizeItems(report && report.insights);

        if (items.length === 0) {
            return;
        }

        renderListCard(block, pageContext, tokens, {
            title: 'Insights',
            items: items,
            accent: '#7C3AED',
            maxItems: resolveMaxItems(block, tokens, 6)
        });
    }

    function normalizeItems(value) {
        if (!Array.isArray(value)) {
            return [];
        }

        return value
            .map(function mapInsight(item) {
                if (typeof item === 'string') {
                    return cleanText(item);
                }

                if (!isPlainObject(item)) {
                    return '';
                }

                return cleanText(
                    item.insight ||
                    item.title ||
                    item.text ||
                    item.description
                );
            })
            .filter(Boolean);
    }

    function renderListCard(block, context, tokens, config) {
        const style = resolveStyle(tokens);
        const visibleItems = config.items.slice(0, config.maxItems);
        const hiddenCount = Math.max(0, config.items.length - visibleItems.length);
        const contentX = block.x + style.padding;
        const contentWidth = Math.max(0, block.width - style.padding * 2);
        let cursorY = block.y + style.padding + style.title.lineHeight + style.titleGap;

        context.drawRectangle({
            x: block.x,
            y: block.y,
            width: block.width,
            height: block.height,
            fill: style.card.fill,
            stroke: style.card.stroke,
            strokeWidth: style.card.strokeWidth,
            radius: style.card.radius
        });

        context.drawText({
            text: config.title,
            x: contentX,
            y: block.y + style.padding,
            width: contentWidth,
            height: style.title.lineHeight,
            fontFamily: style.title.fontFamily,
            fontWeight: style.title.fontWeight,
            fontSize: style.title.fontSize,
            lineHeight: style.title.lineHeight,
            color: style.title.color,
            maxLines: 1,
            overflow: 'clip'
        });

        visibleItems.forEach(function renderItem(item) {
            if (cursorY >= block.y + block.height - style.padding) {
                return;
            }

            context.drawRectangle({
                x: contentX,
                y: cursorY + style.bulletOffsetY,
                width: style.bulletSize,
                height: style.bulletSize,
                fill: config.accent,
                stroke: config.accent,
                strokeWidth: 0,
                radius: style.bulletSize / 2
            });

            context.drawText({
                text: item,
                x: contentX + style.bulletSize + style.bulletGap,
                y: cursorY,
                width: Math.max(
                    0,
                    contentWidth - style.bulletSize - style.bulletGap
                ),
                height: style.itemHeight,
                fontFamily: style.body.fontFamily,
                fontWeight: style.body.fontWeight,
                fontSize: style.body.fontSize,
                lineHeight: style.body.lineHeight,
                color: style.body.color,
                maxLines: style.body.maxLines,
                overflow: 'ellipsis'
            });

            cursorY += style.itemHeight + style.itemGap;
        });

        if (hiddenCount > 0 && cursorY < block.y + block.height - style.padding) {
            context.drawText({
                text: '… +' + hiddenCount + ' more',
                x: contentX,
                y: cursorY,
                width: contentWidth,
                height: style.meta.lineHeight,
                fontFamily: style.meta.fontFamily,
                fontWeight: style.meta.fontWeight,
                fontSize: style.meta.fontSize,
                lineHeight: style.meta.lineHeight,
                color: style.meta.color,
                maxLines: 1,
                overflow: 'clip'
            });
        }
    }

    function resolveStyle(tokens) {
        const source = isPlainObject(tokens) ? tokens : {};
        const typography = isPlainObject(source.typography) ? source.typography : {};
        const spacing = isPlainObject(source.spacing) ? source.spacing : {};
        const colors = isPlainObject(source.colors) ? source.colors : {};
        const card = isPlainObject(source.card) ? source.card : {};

        return {
            padding: finiteOr(spacing.cardPadding, 16),
            titleGap: finiteOr(spacing.titleGap, 9),
            itemGap: finiteOr(spacing.listItemGap, 7),
            itemHeight: finiteOr(spacing.listItemHeight, 31),
            bulletSize: finiteOr(spacing.bulletSize, 5),
            bulletGap: finiteOr(spacing.bulletGap, 9),
            bulletOffsetY: finiteOr(spacing.bulletOffsetY, 6),
            card: {
                fill: colors.cardBackground || '#FFFFFF',
                stroke: colors.cardBorder || '#E5E7EB',
                strokeWidth: finiteOr(card.borderWidth, 1),
                radius: finiteOr(card.radius, 12)
            },
            title: {
                fontFamily: typography.fontFamily || 'Inter',
                fontWeight: typography.titleWeight || 700,
                fontSize: finiteOr(typography.sectionTitleSize, 15),
                lineHeight: finiteOr(typography.sectionTitleLineHeight, 18),
                color: colors.title || '#111827'
            },
            body: {
                fontFamily: typography.fontFamily || 'Inter',
                fontWeight: typography.bodyWeight || 400,
                fontSize: finiteOr(typography.bodySize, 11.5),
                lineHeight: finiteOr(typography.bodyLineHeight, 15),
                color: colors.body || '#374151',
                maxLines: 2
            },
            meta: {
                fontFamily: typography.fontFamily || 'Inter',
                fontWeight: typography.metaWeight || 500,
                fontSize: finiteOr(typography.metaSize, 10),
                lineHeight: finiteOr(typography.metaLineHeight, 13),
                color: colors.muted || '#6B7280'
            }
        };
    }

    function resolveMaxItems(block, tokens, fallback) {
        const density = isPlainObject(tokens && tokens.density) ? tokens.density : {};
        if (Number.isInteger(density.insightsMaxItems) && density.insightsMaxItems > 0) {
            return density.insightsMaxItems;
        }
        return Math.max(1, Math.min(fallback, Math.floor(block.height / 38)));
    }

    function cleanText(value) {
        return value === null || value === undefined
            ? ''
            : String(value).replace(/\s+/g, ' ').trim();
    }

    function validateBlock(block) {
        if (!isPlainObject(block)) {
            throw createError('block must be an object.');
        }

        ['x', 'y', 'width', 'height'].forEach(function validateField(field) {
            if (!Number.isFinite(block[field])) {
                throw createError('block.' + field + ' must be a finite number.');
            }
        });
    }

    function validateContext(context) {
        ['getReport', 'getDesignTokens', 'drawRectangle', 'drawText']
            .forEach(function validateMethod(name) {
                if (!context || typeof context[name] !== 'function') {
                    throw createError('pageContext must expose ' + name + '().');
                }
            });
    }

    function finiteOr(value, fallback) {
        return Number.isFinite(value) ? value : fallback;
    }

    function isPlainObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    function createError(message) {
        return new Error(MODULE_NAME + ': ' + message);
    }

    if (!engine.blockRenderers || typeof engine.blockRenderers.register !== 'function') {
        throw createError('Block Renderers module must be initialized first.');
    }

    engine.blockRenderers.register(RENDERER_ID, renderInsights);
    engine.insightsRenderer = Object.freeze({
        version: VERSION,
        id: RENDERER_ID,
        render: renderInsights
    });
    globalScope.ExecutiveSlideEngine = engine;
})(typeof window !== 'undefined' ? window : globalThis);
