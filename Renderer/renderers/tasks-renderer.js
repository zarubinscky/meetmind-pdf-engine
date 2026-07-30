/*
 * MeetMind AI — Executive Slide Engine
 * tasks-renderer.js
 *
 * Version: 1.0.0
 * Status: Implementation candidate
 */
(function initializeTasksRenderer(globalScope) {
    'use strict';

    const MODULE_NAME = 'TasksRenderer';
    const VERSION = '1.0.0';
    const RENDERER_ID = 'tasks';
    const engine = globalScope.ExecutiveSlideEngine || {};

    function renderTasks(block, pageContext) {
        validateBlock(block);
        validateContext(pageContext);

        const report = pageContext.getReport();
        const tokens = pageContext.getDesignTokens();
        const tasks = normalizeTasks(report && report.tasks);

        if (tasks.length === 0) {
            return;
        }

        const style = resolveStyle(tokens);
        const maxItems = resolveMaxItems(block, tokens);
        const visible = tasks.slice(0, maxItems);
        const hiddenCount = Math.max(0, tasks.length - visible.length);

        drawCard(block, pageContext, style);
        drawHeader(block, pageContext, style);

        let cursorY =
            block.y +
            style.padding +
            style.title.lineHeight +
            style.titleGap;

        visible.forEach(function renderTask(task) {
            if (cursorY >= block.y + block.height - style.padding) {
                return;
            }

            drawTaskRow(block, task, cursorY, pageContext, style);
            cursorY += style.rowHeight + style.rowGap;
        });

        if (hiddenCount > 0 && cursorY < block.y + block.height - style.padding) {
            pageContext.drawText({
                text: '… +' + hiddenCount + ' more',
                x: block.x + style.padding,
                y: cursorY,
                width: Math.max(0, block.width - style.padding * 2),
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

    function drawCard(block, context, style) {
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
    }

    function drawHeader(block, context, style) {
        context.drawText({
            text: 'Tasks',
            x: block.x + style.padding,
            y: block.y + style.padding,
            width: Math.max(0, block.width - style.padding * 2),
            height: style.title.lineHeight,
            fontFamily: style.title.fontFamily,
            fontWeight: style.title.fontWeight,
            fontSize: style.title.fontSize,
            lineHeight: style.title.lineHeight,
            color: style.title.color,
            maxLines: 1,
            overflow: 'clip'
        });
    }

    function drawTaskRow(block, task, y, context, style) {
        const contentX = block.x + style.padding;
        const contentWidth = Math.max(0, block.width - style.padding * 2);
        const ownerWidth = Math.min(style.ownerWidth, contentWidth * 0.24);
        const dueWidth = Math.min(style.dueWidth, contentWidth * 0.22);
        const taskWidth = Math.max(
            0,
            contentWidth -
            ownerWidth -
            dueWidth -
            style.columnGap * 2
        );

        context.drawText({
            text: task.owner || '—',
            x: contentX,
            y: y,
            width: ownerWidth,
            height: style.rowHeight,
            fontFamily: style.owner.fontFamily,
            fontWeight: style.owner.fontWeight,
            fontSize: style.owner.fontSize,
            lineHeight: style.owner.lineHeight,
            color: style.owner.color,
            maxLines: 1,
            overflow: 'ellipsis'
        });

        context.drawText({
            text: task.title,
            x: contentX + ownerWidth + style.columnGap,
            y: y,
            width: taskWidth,
            height: style.rowHeight,
            fontFamily: style.body.fontFamily,
            fontWeight: style.body.fontWeight,
            fontSize: style.body.fontSize,
            lineHeight: style.body.lineHeight,
            color: style.body.color,
            maxLines: 2,
            overflow: 'ellipsis'
        });

        context.drawText({
            text: task.dueDate || '—',
            x:
                contentX +
                ownerWidth +
                style.columnGap +
                taskWidth +
                style.columnGap,
            y: y,
            width: dueWidth,
            height: style.rowHeight,
            fontFamily: style.due.fontFamily,
            fontWeight: style.due.fontWeight,
            fontSize: style.due.fontSize,
            lineHeight: style.due.lineHeight,
            color: style.due.color,
            align: 'right',
            maxLines: 1,
            overflow: 'ellipsis'
        });
    }

    function normalizeTasks(value) {
        if (!Array.isArray(value)) {
            return [];
        }

        return value
            .map(function mapTask(item) {
                if (typeof item === 'string') {
                    return {
                        title: cleanText(item),
                        owner: '',
                        dueDate: ''
                    };
                }

                if (!isPlainObject(item)) {
                    return null;
                }

                const title = cleanText(
                    item.task ||
                    item.title ||
                    item.text ||
                    item.description
                );

                if (!title) {
                    return null;
                }

                return {
                    title: title,
                    owner: cleanText(
                        item.owner ||
                        item.assignee ||
                        item.responsible
                    ),
                    dueDate: cleanText(
                        item.due_date ||
                        item.dueDate ||
                        item.deadline
                    )
                };
            })
            .filter(Boolean);
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
            rowGap: finiteOr(spacing.taskRowGap, 5),
            rowHeight: finiteOr(spacing.taskRowHeight, 32),
            columnGap: finiteOr(spacing.taskColumnGap, 10),
            ownerWidth: finiteOr(spacing.taskOwnerWidth, 92),
            dueWidth: finiteOr(spacing.taskDueWidth, 76),
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
            owner: {
                fontFamily: typography.fontFamily || 'Inter',
                fontWeight: 600,
                fontSize: finiteOr(typography.taskMetaSize, 10),
                lineHeight: finiteOr(typography.taskMetaLineHeight, 14),
                color: colors.accent || '#2563EB'
            },
            body: {
                fontFamily: typography.fontFamily || 'Inter',
                fontWeight: typography.bodyWeight || 400,
                fontSize: finiteOr(typography.bodySize, 11),
                lineHeight: finiteOr(typography.bodyLineHeight, 14),
                color: colors.body || '#374151'
            },
            due: {
                fontFamily: typography.fontFamily || 'Inter',
                fontWeight: 500,
                fontSize: finiteOr(typography.taskMetaSize, 10),
                lineHeight: finiteOr(typography.taskMetaLineHeight, 14),
                color: colors.muted || '#6B7280'
            },
            meta: {
                fontFamily: typography.fontFamily || 'Inter',
                fontWeight: 500,
                fontSize: finiteOr(typography.metaSize, 10),
                lineHeight: finiteOr(typography.metaLineHeight, 13),
                color: colors.muted || '#6B7280'
            }
        };
    }

    function resolveMaxItems(block, tokens) {
        const density = isPlainObject(tokens && tokens.density) ? tokens.density : {};

        if (Number.isInteger(density.tasksMaxItems) && density.tasksMaxItems > 0) {
            return density.tasksMaxItems;
        }

        const available = Math.max(0, block.height - 55);
        return Math.max(1, Math.floor(available / 37));
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

    engine.blockRenderers.register(RENDERER_ID, renderTasks);
    engine.tasksRenderer = Object.freeze({
        version: VERSION,
        id: RENDERER_ID,
        render: renderTasks
    });
    globalScope.ExecutiveSlideEngine = engine;
})(typeof window !== 'undefined' ? window : globalThis);
