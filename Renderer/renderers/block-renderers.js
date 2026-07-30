/*
 * MeetMind AI — Executive Slide Engine
 * block-renderers.js
 *
 * Version: 1.0.0-review.1
 * Status: Production candidate for Internal Implementation Review
 *
 * Public API:
 *   ExecutiveSlideEngine.blockRenderers.version
 *   ExecutiveSlideEngine.blockRenderers.header(block, renderContext)
 *   ExecutiveSlideEngine.blockRenderers.stats(block, renderContext)
 *   ExecutiveSlideEngine.blockRenderers.summary(block, renderContext)
 *   ExecutiveSlideEngine.blockRenderers.metrics(block, renderContext)
 *   ExecutiveSlideEngine.blockRenderers.insights(block, renderContext)
 *   ExecutiveSlideEngine.blockRenderers.decisions(block, renderContext)
 *   ExecutiveSlideEngine.blockRenderers.risks(block, renderContext)
 *   ExecutiveSlideEngine.blockRenderers.tasks(block, renderContext)
 *   ExecutiveSlideEngine.blockRenderers.architecture(block, renderContext)
 *   ExecutiveSlideEngine.blockRenderers.owners(block, renderContext)
 *   ExecutiveSlideEngine.blockRenderers.footer(block, renderContext)
 *
 * Frozen invocation contract:
 *   blockRenderer(block, renderContext)
 *
 * This module draws only inside geometry supplied by LayoutResult.
 * It does not measure blocks, calculate layout, paginate, apply overflow
 * policy, mutate LayoutResult, or inspect unrelated business state.
 */

(function initializeBlockRenderers(globalScope) {
    'use strict';

    const MODULE_NAME = 'Block Renderers';
    const VERSION = '1.0.0-review.1';
    const engine = globalScope.ExecutiveSlideEngine || {};

    const SECTION_TITLES = Object.freeze({
        summary: 'Executive Summary',
        metrics: 'Key Metrics',
        insights: 'Insights',
        decisions: 'Decisions',
        risks: 'Risks',
        tasks: 'Tasks',
        architecture: 'Architecture',
        owners: 'Owners',
        stats: 'Meeting Statistics'
    });

    function renderHeader(block, renderContext) {
        const state = createRenderState(block, renderContext);
        const report = state.report;
        const title = firstText(
            report.title,
            report.meeting_title,
            report.meetingTitle,
            report.name,
            'Meeting Report'
        );
        const subtitleParts = [
            firstText(report.date, report.meeting_date, report.meetingDate),
            firstText(report.duration, report.duration_text, report.durationText),
            firstText(report.source, report.source_file, report.sourceFile)
        ].filter(Boolean);

        drawText(state, {
            text: title,
            x: state.box.x,
            yTop: state.box.y,
            width: state.box.width,
            maxHeight: Math.min(state.box.height, 28),
            style: tokenTextStyle(state, 'headerTitle'),
            maxLines: 1
        });

        if (subtitleParts.length > 0) {
            drawText(state, {
                text: subtitleParts.join('  •  '),
                x: state.box.x,
                yTop: state.box.y + 28,
                width: state.box.width,
                maxHeight: Math.max(0, state.box.height - 28),
                style: tokenTextStyle(state, 'headerSubtitle'),
                maxLines: 2
            });
        }
    }

    function renderStats(block, renderContext) {
        const state = createRenderState(block, renderContext);
        drawCard(state, { service: true });
        drawSectionHeader(state, SECTION_TITLES.stats, 'service');

        const entries = normalizeStats(state.report.stats);
        const content = entries.length > 0
            ? entries.map(function mapEntry(entry) {
                return entry.label + ': ' + entry.value;
            }).join('   •   ')
            : '—';

        drawBodyText(state, content, {
            role: 'service',
            color: 'secondary',
            maxLines: 2
        });
    }

    function renderSummary(block, renderContext) {
        const state = createRenderState(block, renderContext);
        drawCard(state);
        drawSectionHeader(state, SECTION_TITLES.summary, 'primary');
        drawBodyText(
            state,
            firstText(
                state.report.summary,
                state.report.executive_summary,
                state.report.executiveSummary,
                state.report.meeting_summary,
                state.report.meetingSummary,
                '—'
            ),
            {
                role: 'primary'
            }
        );
    }

    function renderMetrics(block, renderContext) {
        const state = createRenderState(block, renderContext);
        drawCard(state);
        drawSectionHeader(state, SECTION_TITLES.metrics, 'core');
        drawMetricGrid(state, normalizeMetrics(state.report.metrics));
    }

    function renderInsights(block, renderContext) {
        renderListSection(
            block,
            renderContext,
            SECTION_TITLES.insights,
            stateValue(renderContext, 'insights'),
            'core'
        );
    }

    function renderDecisions(block, renderContext) {
        renderListSection(
            block,
            renderContext,
            SECTION_TITLES.decisions,
            stateValue(renderContext, 'decisions'),
            'core'
        );
    }

    function renderRisks(block, renderContext) {
        renderListSection(
            block,
            renderContext,
            SECTION_TITLES.risks,
            stateValue(renderContext, 'risks'),
            'core'
        );
    }

    function renderTasks(block, renderContext) {
        const state = createRenderState(block, renderContext);
        drawCard(state);
        drawSectionHeader(state, SECTION_TITLES.tasks, 'core');
        drawTaskTable(state, normalizeTasks(state.report.tasks));
    }

    function renderArchitecture(block, renderContext) {
        const state = createRenderState(block, renderContext);
        drawCard(state);
        drawSectionHeader(state, SECTION_TITLES.architecture, 'supporting');
        drawArchitectureGrid(
            state,
            normalizeListItems(state.report.architecture)
        );
    }

    function renderOwners(block, renderContext) {
        const state = createRenderState(block, renderContext);
        drawCard(state, { service: true });
        drawSectionHeader(state, SECTION_TITLES.owners, 'service');

        const owners = normalizeOwners(state.report.owners);
        const content = owners.length > 0
            ? owners.map(function mapOwner(owner) {
                return owner.role
                    ? owner.name + ' — ' + owner.role
                    : owner.name;
            }).join('   •   ')
            : '—';

        drawBodyText(state, content, {
            role: 'service',
            maxLines: 3
        });
    }

    function renderFooter(block, renderContext) {
        const state = createRenderState(block, renderContext);
        drawDivider(state, state.box.x, state.box.y, state.box.width);

        const footerText = firstText(
            state.options.footerText,
            state.options.footer_text,
            'Generated by MeetMind AI'
        );

        drawText(state, {
            text: footerText,
            x: state.box.x,
            yTop: state.box.y + 6,
            width: state.box.width,
            maxHeight: Math.max(0, state.box.height - 6),
            style: tokenTextStyle(state, 'small'),
            maxLines: 1
        });
    }

    function renderListSection(
        block,
        renderContext,
        title,
        source,
        role
    ) {
        const state = createRenderState(block, renderContext);
        drawCard(state);
        drawSectionHeader(state, title, role);
        drawBulletList(state, normalizeListItems(source), role);
    }

    function createRenderState(block, renderContext) {
        validateDependencies();
        validateBlock(block);
        validateRenderContext(renderContext);

        const offsets = resolveOffsets(renderContext);
        const box = {
            x: block.x + offsets.x,
            y: block.y + offsets.y,
            width: block.width,
            height: block.height
        };

        return {
            block,
            context: renderContext,
            page: renderContext.page,
            fonts: renderContext.fonts,
            report: isPlainObject(renderContext.report)
                ? renderContext.report
                : {},
            options: isPlainObject(renderContext.options)
                ? renderContext.options
                : {},
            design: engine.design,
            tokens: engine.design.TOKENS,
            density: normalizeDensity(renderContext.density),
            box
        };
    }

    function resolveOffsets(renderContext) {
        if (isPlainObject(renderContext.contentOffset)) {
            return {
                x: finiteOrZero(renderContext.contentOffset.x),
                y: finiteOrZero(renderContext.contentOffset.y)
            };
        }

        if (isPlainObject(renderContext.layoutOptions)) {
            return {
                x: finiteOrZero(renderContext.layoutOptions.contentX),
                y: finiteOrZero(renderContext.layoutOptions.contentY)
            };
        }

        return {
            x: finiteOrZero(renderContext.contentX),
            y: finiteOrZero(renderContext.contentY)
        };
    }

    function stateValue(renderContext, key) {
        return isPlainObject(renderContext) &&
            isPlainObject(renderContext.report)
            ? renderContext.report[key]
            : undefined;
    }

    function drawCard(state, options) {
        const settings = options || {};
        const tokens = state.tokens;
        const border = resolveCardBorder(tokens);
        const radius = resolveCardRadius(tokens);
        const backgroundName = settings.service
            ? 'serviceBackground'
            : 'cardBackground';

        const drawOptions = {
            x: state.box.x,
            y: toPdfY(state, state.box.y + state.box.height),
            width: state.box.width,
            height: state.box.height,
            color: resolveColor(state, backgroundName),
            borderColor: resolveColor(state, border.color),
            borderWidth: border.width
        };

        if (radius > 0 && supportsRoundedRectangle(state.page)) {
            state.page.drawRectangle(drawOptions);
            return;
        }

        state.page.drawRectangle(drawOptions);
    }

    function drawSectionHeader(state, title, role) {
        const padding = densityTokens(state).cardPadding;
        const style = textRole(state, role).title;
        const iconSize = resolveIconSize(state);
        const iconGap = Math.max(4, densityTokens(state).titleGap);
        const icon = resolveIcon(title);

        let textX = state.box.x + padding;
        const top = state.box.y + padding;

        if (icon) {
            drawIcon(state, icon, {
                x: textX,
                yTop: top + Math.max(0, (style.lineHeight - iconSize) / 2),
                size: iconSize
            });
            textX += iconSize + iconGap;
        }

        drawText(state, {
            text: title,
            x: textX,
            yTop: top,
            width: Math.max(
                0,
                state.box.x + state.box.width - padding - textX
            ),
            maxHeight: style.lineHeight,
            style,
            maxLines: 1
        });
    }

    function drawBodyText(state, text, options) {
        const settings = options || {};
        const role = settings.role || 'core';
        const roleStyle = textRole(state, role);
        const style = Object.assign(
            {},
            roleStyle.body,
            settings.color ? { color: settings.color } : {}
        );
        const content = contentBox(state, roleStyle);

        drawText(state, {
            text: firstText(text, '—'),
            x: content.x,
            yTop: content.y,
            width: content.width,
            maxHeight: content.height,
            style,
            maxLines: settings.maxLines
        });
    }

    function drawBulletList(state, items, role) {
        const roleStyle = textRole(state, role || 'core');
        const content = contentBox(state, roleStyle);
        const spacing = densityTokens(state);
        const bulletIndent = resolveBulletIndent(state);
        const bulletRadius = resolveBulletRadius(state);
        const textX = content.x + bulletIndent;
        const textWidth = Math.max(0, content.width - bulletIndent);
        let yTop = content.y;
        let rendered = 0;

        if (items.length === 0) {
            drawBodyText(state, '—', { role: role || 'core', maxLines: 1 });
            return;
        }

        for (let index = 0; index < items.length; index += 1) {
            const item = items[index];
            const remainingHeight =
                content.y + content.height - yTop;

            if (remainingHeight < roleStyle.body.lineHeight) {
                break;
            }

            const lineBudget = Math.max(
                1,
                Math.floor(
                    remainingHeight /
                    roleStyle.body.lineHeight
                )
            );

            const combined = item.description
                ? item.title + '\n' + item.description
                : item.title;

            const result = drawText(state, {
                text: combined,
                x: textX,
                yTop,
                width: textWidth,
                maxHeight: remainingHeight,
                style: roleStyle.body,
                secondaryLineStyle: roleStyle.secondary,
                maxLines: Math.min(3, lineBudget)
            });

            drawCircle(state, {
                x: content.x + bulletRadius,
                yTop: yTop + roleStyle.body.size * 0.55,
                radius: bulletRadius,
                color: 'accent'
            });

            yTop += result.height + spacing.bulletGap;
            rendered += 1;
        }

        const hiddenCount = items.length - rendered;
        if (
            hiddenCount > 0 &&
            yTop + roleStyle.secondary.lineHeight <=
                content.y + content.height
        ) {
            drawText(state, {
                text: '… +' + hiddenCount + ' more',
                x: textX,
                yTop,
                width: textWidth,
                maxHeight:
                    content.y + content.height - yTop,
                style: roleStyle.secondary,
                maxLines: 1
            });
        }
    }

    function drawMetricGrid(state, metrics) {
        const roleStyle = textRole(state, 'core');
        const content = contentBox(state, roleStyle);
        const gap = densityTokens(state).metricGap;

        if (metrics.length === 0) {
            drawBodyText(state, '—', { role: 'core', maxLines: 1 });
            return;
        }

        const columns = metrics.length <= 2
            ? metrics.length
            : Math.min(4, metrics.length);
        const rows = Math.ceil(metrics.length / columns);
        const cellWidth =
            (content.width - gap * (columns - 1)) / columns;
        const cellHeight =
            (content.height - gap * Math.max(0, rows - 1)) / rows;

        metrics.forEach(function renderMetric(metric, index) {
            const column = index % columns;
            const row = Math.floor(index / columns);
            const x = content.x + column * (cellWidth + gap);
            const yTop = content.y + row * (cellHeight + gap);
            const cellPadding = Math.min(6, densityTokens(state).cardPadding);

            state.page.drawRectangle({
                x,
                y: toPdfY(state, yTop + cellHeight),
                width: cellWidth,
                height: cellHeight,
                color: resolveColor(state, 'pageBackground'),
                borderColor: resolveColor(state, 'cardBorder'),
                borderWidth: resolveCardBorder(state.tokens).width
            });

            drawText(state, {
                text: firstText(metric.value, '—'),
                x: x + cellPadding,
                yTop: yTop + cellPadding,
                width: Math.max(0, cellWidth - cellPadding * 2),
                maxHeight: Math.min(
                    tokenTextStyle(state, 'metricValue').lineHeight,
                    cellHeight
                ),
                style: tokenTextStyle(state, 'metricValue'),
                maxLines: 1
            });

            drawText(state, {
                text: firstText(metric.label, ''),
                x: x + cellPadding,
                yTop:
                    yTop +
                    cellPadding +
                    tokenTextStyle(state, 'metricValue').lineHeight,
                width: Math.max(0, cellWidth - cellPadding * 2),
                maxHeight: Math.max(
                    0,
                    cellHeight -
                    cellPadding * 2 -
                    tokenTextStyle(state, 'metricValue').lineHeight
                ),
                style: tokenTextStyle(state, 'metricLabel'),
                maxLines: 2
            });
        });
    }

    function drawTaskTable(state, tasks) {
        const roleStyle = textRole(state, 'core');
        const content = contentBox(state, roleStyle);
        const headerStyle = roleStyle.secondary;
        const bodyStyle = roleStyle.body;
        const gap = Math.max(4, densityTokens(state).metricGap);
        const ownerWidth = content.width * 0.22;
        const dueWidth = content.width * 0.18;
        const taskWidth = Math.max(
            0,
            content.width - ownerWidth - dueWidth - gap * 2
        );
        const columns = {
            ownerX: content.x,
            taskX: content.x + ownerWidth + gap,
            dueX: content.x + ownerWidth + gap + taskWidth + gap
        };
        const headerHeight = headerStyle.lineHeight + 4;
        let yTop = content.y;

        drawText(state, {
            text: 'Owner',
            x: columns.ownerX,
            yTop,
            width: ownerWidth,
            maxHeight: headerHeight,
            style: headerStyle,
            maxLines: 1
        });
        drawText(state, {
            text: 'Task',
            x: columns.taskX,
            yTop,
            width: taskWidth,
            maxHeight: headerHeight,
            style: headerStyle,
            maxLines: 1
        });
        drawText(state, {
            text: 'Due Date',
            x: columns.dueX,
            yTop,
            width: dueWidth,
            maxHeight: headerHeight,
            style: headerStyle,
            maxLines: 1
        });

        yTop += headerHeight;
        drawDivider(state, content.x, yTop - 2, content.width);

        if (tasks.length === 0) {
            drawText(state, {
                text: '—',
                x: content.x,
                yTop,
                width: content.width,
                maxHeight: Math.max(0, content.y + content.height - yTop),
                style: bodyStyle,
                maxLines: 1
            });
            return;
        }

        let rendered = 0;

        for (let index = 0; index < tasks.length; index += 1) {
            const task = tasks[index];
            const remaining =
                content.y + content.height - yTop;

            if (remaining < bodyStyle.lineHeight) {
                break;
            }

            const taskLines = wrapText(
                state,
                task.title,
                taskWidth,
                bodyStyle
            ).slice(0, 2);
            const rowHeight = Math.max(
                bodyStyle.lineHeight,
                taskLines.length * bodyStyle.lineHeight
            ) + 3;

            if (rowHeight > remaining) {
                break;
            }

            drawText(state, {
                text: task.owner,
                x: columns.ownerX,
                yTop,
                width: ownerWidth,
                maxHeight: rowHeight,
                style: bodyStyle,
                maxLines: 1
            });
            drawText(state, {
                text: task.title,
                x: columns.taskX,
                yTop,
                width: taskWidth,
                maxHeight: rowHeight,
                style: bodyStyle,
                maxLines: 2
            });
            drawText(state, {
                text: task.due,
                x: columns.dueX,
                yTop,
                width: dueWidth,
                maxHeight: rowHeight,
                style: roleStyle.secondary,
                maxLines: 1
            });

            yTop += rowHeight;
            rendered += 1;

            if (index < tasks.length - 1) {
                drawDivider(state, content.x, yTop - 1, content.width);
            }
        }

        const hiddenCount = tasks.length - rendered;
        if (
            hiddenCount > 0 &&
            yTop + roleStyle.secondary.lineHeight <=
                content.y + content.height
        ) {
            drawText(state, {
                text: '… +' + hiddenCount + ' more',
                x: content.x,
                yTop,
                width: content.width,
                maxHeight:
                    content.y + content.height - yTop,
                style: roleStyle.secondary,
                maxLines: 1
            });
        }
    }

    function drawArchitectureGrid(state, items) {
        const roleStyle = textRole(state, 'supporting');
        const content = contentBox(state, roleStyle);

        if (items.length === 0) {
            drawBodyText(state, '—', {
                role: 'supporting',
                maxLines: 1
            });
            return;
        }

        const visible = items.slice(0, 16);
        const columns = 4;
        const rows = Math.ceil(visible.length / columns);
        const columnGap = Math.max(4, densityTokens(state).metricGap);
        const rowGap = columnGap;
        const cellWidth =
            (content.width - columnGap * (columns - 1)) / columns;
        const cellHeight =
            (content.height - rowGap * Math.max(0, rows - 1)) / rows;

        visible.forEach(function renderArchitectureItem(item, index) {
            const column = index % columns;
            const row = Math.floor(index / columns);
            const x = content.x + column * (cellWidth + columnGap);
            const yTop = content.y + row * (cellHeight + rowGap);
            const padding = Math.min(5, densityTokens(state).cardPadding);

            state.page.drawRectangle({
                x,
                y: toPdfY(state, yTop + cellHeight),
                width: cellWidth,
                height: cellHeight,
                color: resolveColor(state, 'pageBackground'),
                borderColor: resolveColor(state, 'cardBorder'),
                borderWidth: resolveCardBorder(state.tokens).width
            });

            drawText(state, {
                text: item.title,
                x: x + padding,
                yTop: yTop + padding,
                width: Math.max(0, cellWidth - padding * 2),
                maxHeight: Math.max(0, cellHeight - padding * 2),
                style: roleStyle.body,
                maxLines: 2,
                align: 'center'
            });
        });
    }

    function drawText(state, options) {
        const text = firstText(options.text, '');
        const style = options.style;
        const width = Math.max(0, options.width);
        const maxHeight = Math.max(0, options.maxHeight);
        const maxLinesByHeight = style.lineHeight > 0
            ? Math.floor(maxHeight / style.lineHeight)
            : 0;
        const requestedMaxLines = Number.isInteger(options.maxLines)
            ? options.maxLines
            : Number.MAX_SAFE_INTEGER;
        const maxLines = Math.max(
            0,
            Math.min(maxLinesByHeight, requestedMaxLines)
        );

        if (!text || width <= 0 || maxLines <= 0) {
            return { lines: [], height: 0 };
        }

        let lines = wrapText(state, text, width, style);
        if (lines.length > maxLines) {
            lines = lines.slice(0, maxLines);
            lines[lines.length - 1] = ellipsizeLine(
                state,
                lines[lines.length - 1],
                width,
                style
            );
        }

        lines.forEach(function renderLine(line, index) {
            const font = resolveFont(state, style.font);
            const lineWidth = safeTextWidth(font, line, style.size);
            let x = options.x;

            if (options.align === 'center') {
                x += Math.max(0, (width - lineWidth) / 2);
            } else if (options.align === 'right') {
                x += Math.max(0, width - lineWidth);
            }

            state.page.drawText(line, {
                x,
                y: toPdfY(
                    state,
                    options.yTop +
                    index * style.lineHeight +
                    style.size
                ),
                size: style.size,
                font,
                color: resolveColor(state, style.color)
            });
        });

        return {
            lines,
            height: lines.length * style.lineHeight
        };
    }

    function drawDivider(state, x, yTop, width) {
        if (width <= 0) {
            return;
        }

        const y = toPdfY(state, yTop);
        state.page.drawLine({
            start: { x, y },
            end: { x: x + width, y },
            thickness: resolveCardBorder(state.tokens).width,
            color: resolveColor(state, 'cardBorder')
        });
    }

    function drawCircle(state, options) {
        if (typeof state.page.drawCircle !== 'function') {
            return;
        }

        state.page.drawCircle({
            x: options.x,
            y: toPdfY(state, options.yTop),
            size: options.radius,
            color: resolveColor(state, options.color)
        });
    }

    function drawIcon(state, iconName, options) {
        if (
            engine.icons &&
            typeof engine.icons.draw === 'function'
        ) {
            engine.icons.draw(iconName, {
                page: state.page,
                x: options.x,
                y: toPdfY(state, options.yTop + options.size),
                size: options.size,
                color: resolveColor(state, 'accent')
            });
        }
    }

    function contentBox(state, roleStyle) {
        const spacing = densityTokens(state);
        const padding = spacing.cardPadding;
        const titleHeight = roleStyle.title.lineHeight;
        const titleGap = spacing.titleGap;
        const x = state.box.x + padding;
        const y =
            state.box.y +
            padding +
            titleHeight +
            titleGap;
        const width = Math.max(
            0,
            state.box.width - padding * 2
        );
        const height = Math.max(
            0,
            state.box.y +
            state.box.height -
            padding -
            y
        );

        return { x, y, width, height };
    }

    function wrapText(state, value, maxWidth, style) {
        const text = firstText(value, '');
        if (!text) {
            return [];
        }

        const font = resolveFont(state, style.font);
        const paragraphs = text
            .replace(/\r\n?/g, '\n')
            .split('\n');
        const lines = [];

        paragraphs.forEach(function wrapParagraph(paragraph) {
            const words = paragraph.trim().split(/\s+/).filter(Boolean);

            if (words.length === 0) {
                lines.push('');
                return;
            }

            let currentLine = '';

            words.forEach(function appendWord(word) {
                const candidate = currentLine
                    ? currentLine + ' ' + word
                    : word;

                if (
                    currentLine &&
                    safeTextWidth(font, candidate, style.size) >
                        maxWidth
                ) {
                    lines.push(currentLine);
                    currentLine = fitWord(
                        font,
                        word,
                        style.size,
                        maxWidth
                    );
                } else {
                    currentLine = candidate;
                }
            });

            if (currentLine) {
                lines.push(currentLine);
            }
        });

        return lines;
    }

    function fitWord(font, word, size, maxWidth) {
        if (safeTextWidth(font, word, size) <= maxWidth) {
            return word;
        }

        let result = '';
        for (const character of Array.from(word)) {
            const candidate = result + character;
            if (safeTextWidth(font, candidate + '…', size) > maxWidth) {
                break;
            }
            result = candidate;
        }

        return result ? result + '…' : '…';
    }

    function ellipsizeLine(state, line, maxWidth, style) {
        const font = resolveFont(state, style.font);
        const suffix = '…';

        if (safeTextWidth(font, line + suffix, style.size) <= maxWidth) {
            return line + suffix;
        }

        let result = line;
        while (
            result.length > 0 &&
            safeTextWidth(font, result + suffix, style.size) > maxWidth
        ) {
            result = result.slice(0, -1);
        }

        return result.trimEnd() + suffix;
    }

    function normalizeListItems(value) {
        if (!Array.isArray(value)) {
            if (typeof value === 'string' && value.trim()) {
                return [{ title: value.trim(), description: '' }];
            }
            return [];
        }

        return value
            .map(function normalizeItem(item) {
                if (typeof item === 'string') {
                    return {
                        title: item.trim(),
                        description: ''
                    };
                }

                if (!isPlainObject(item)) {
                    return null;
                }

                const title = firstText(
                    item.title,
                    item.name,
                    item.text,
                    item.decision,
                    item.insight,
                    item.risk,
                    item.task
                );

                if (!title) {
                    return null;
                }

                return {
                    title,
                    description: firstText(
                        item.description,
                        item.details,
                        item.detail,
                        item.context,
                        ''
                    )
                };
            })
            .filter(Boolean);
    }

    function normalizeTasks(value) {
        if (!Array.isArray(value)) {
            return [];
        }

        return value
            .map(function normalizeTask(task) {
                if (typeof task === 'string') {
                    return {
                        owner: '—',
                        title: task.trim(),
                        due: '—'
                    };
                }
                if (!isPlainObject(task)) {
                    return null;
                }

                const title = firstText(
                    task.title,
                    task.task,
                    task.name,
                    task.text
                );

                if (!title) {
                    return null;
                }

                return {
                    owner: firstText(
                        task.owner,
                        task.responsible,
                        task.assignee,
                        '—'
                    ),
                    title,
                    due: firstText(
                        task.due,
                        task.due_date,
                        task.dueDate,
                        task.deadline,
                        '—'
                    )
                };
            })
            .filter(Boolean);
    }

    function normalizeMetrics(value) {
        if (!Array.isArray(value)) {
            if (isPlainObject(value)) {
                return Object.keys(value).map(function mapMetric(key) {
                    return {
                        label: humanizeKey(key),
                        value: firstText(value[key], '—')
                    };
                });
            }
            return [];
        }

        return value
            .map(function normalizeMetric(metric) {
                if (!isPlainObject(metric)) {
                    return null;
                }

                return {
                    label: firstText(
                        metric.label,
                        metric.name,
                        metric.title,
                        ''
                    ),
                    value: firstText(
                        metric.value,
                        metric.metric,
                        metric.amount,
                        '—'
                    )
                };
            })
            .filter(function validMetric(metric) {
                return metric && (metric.label || metric.value);
            });
    }

    function normalizeStats(value) {
        if (!isPlainObject(value)) {
            return [];
        }

        return Object.keys(value)
            .filter(function filterStat(key) {
                return value[key] !== undefined &&
                    value[key] !== null &&
                    value[key] !== '';
            })
            .map(function mapStat(key) {
                return {
                    label: humanizeKey(key),
                    value: String(value[key])
                };
            });
    }

    function normalizeOwners(value) {
        if (!Array.isArray(value)) {
            return [];
        }

        return value
            .map(function normalizeOwner(owner) {
                if (typeof owner === 'string') {
                    return {
                        name: owner.trim(),
                        role: ''
                    };
                }

                if (!isPlainObject(owner)) {
                    return null;
                }

                const name = firstText(
                    owner.name,
                    owner.owner,
                    owner.person,
                    owner.responsible
                );

                if (!name) {
                    return null;
                }

                return {
                    name,
                    role: firstText(
                        owner.role,
                        owner.area,
                        owner.responsibility,
                        ''
                    )
                };
            })
            .filter(Boolean);
    }

    function tokenTextStyle(state, name) {
        const source = state.tokens.typography[name];
        if (!isPlainObject(source)) {
            throw createError(
                'Design token typography.' + name + ' is missing.'
            );
        }

        return {
            font: source.font,
            size: source.size,
            lineHeight: source.lineHeight,
            color: source.color
        };
    }

    function textRole(state, role) {
        if (typeof state.design.getTextStyle === 'function') {
            return state.design.getTextStyle(role, state.density);
        }

        const hierarchy = state.tokens.typography.hierarchy;
        const normalizedRole = Object.prototype.hasOwnProperty.call(
            hierarchy,
            role
        ) ? role : 'core';

        return hierarchy[normalizedRole];
    }

    function densityTokens(state) {
        if (typeof state.design.getDensityTokens === 'function') {
            return state.design.getDensityTokens(state.density);
        }

        const density = state.tokens.density;
        return density[state.density] || density.regular;
    }

    function normalizeDensity(value) {
        return typeof value === 'string' &&
            engine.design &&
            engine.design.TOKENS &&
            engine.design.TOKENS.density &&
            Object.prototype.hasOwnProperty.call(
                engine.design.TOKENS.density,
                value
            )
            ? value
            : 'regular';
    }

    function resolveCardBorder(tokens) {
        if (
            isPlainObject(tokens.borders) &&
            isPlainObject(tokens.borders.card)
        ) {
            return {
                width: finiteOrDefault(tokens.borders.card.width, 0.5),
                color: firstText(
                    tokens.borders.card.color,
                    'cardBorder'
                )
            };
        }

        if (isPlainObject(tokens.card)) {
            return {
                width: finiteOrDefault(tokens.card.borderWidth, 0.5),
                color: 'cardBorder'
            };
        }

        return {
            width: 0.5,
            color: 'cardBorder'
        };
    }

    function resolveCardRadius(tokens) {
        if (
            isPlainObject(tokens.radius) &&
            Number.isFinite(tokens.radius.card)
        ) {
            return tokens.radius.card;
        }

        if (
            isPlainObject(tokens.radii) &&
            Number.isFinite(tokens.radii.card)
        ) {
            return tokens.radii.card;
        }

        return 0;
    }

    function resolveBulletIndent(state) {
        const bullets = state.tokens.bullets;
        return isPlainObject(bullets) &&
            Number.isFinite(bullets.indent)
            ? bullets.indent
            : 9;
    }

    function resolveBulletRadius(state) {
        const bullets = state.tokens.bullets;
        return isPlainObject(bullets) &&
            Number.isFinite(bullets.radius)
            ? bullets.radius
            : 1.5;
    }

    function resolveIconSize(state) {
        const icons = state.tokens.icons;
        const base = isPlainObject(icons) &&
            Number.isFinite(icons.size)
            ? icons.size
            : 10;

        return base * finiteOrDefault(
            densityTokens(state).iconScale,
            1
        );
    }

    function resolveIcon(title) {
        const normalized = title.toLowerCase();

        if (normalized.includes('summary')) return 'summary';
        if (normalized.includes('metric')) return 'metrics';
        if (normalized.includes('insight')) return 'insights';
        if (normalized.includes('decision')) return 'decisions';
        if (normalized.includes('risk')) return 'risks';
        if (normalized.includes('task')) return 'tasks';
        if (normalized.includes('architecture')) return 'architecture';
        if (normalized.includes('owner')) return 'owners';
        if (normalized.includes('stat')) return 'stats';

        return null;
    }

    function resolveColor(state, name) {
        const colors = state.tokens.colors;
        const value = colors[name] || colors.body;

        if (
            !Array.isArray(value) ||
            value.length !== 3 ||
            !value.every(Number.isFinite)
        ) {
            throw createError(
                'Invalid color token "' + name + '".'
            );
        }

        return globalScope.PDFLib.rgb(
            value[0],
            value[1],
            value[2]
        );
    }

    function resolveFont(state, name) {
        const familyName =
            state.tokens.typography &&
            state.tokens.typography.families &&
            state.tokens.typography.families[name]
                ? state.tokens.typography.families[name]
                : name;

        const font = state.fonts[familyName] || state.fonts[name];

        if (!font || typeof font.widthOfTextAtSize !== 'function') {
            throw createError(
                'Font "' + familyName + '" is not available.'
            );
        }

        return font;
    }

    function toPdfY(state, yTop) {
        const pageHeight = getPageHeight(state.page);
        return pageHeight - yTop;
    }

    function getPageHeight(page) {
        if (typeof page.getSize === 'function') {
            return page.getSize().height;
        }

        if (typeof page.getHeight === 'function') {
            return page.getHeight();
        }

        throw createError('Unable to resolve PDF page height.');
    }

    function safeTextWidth(font, text, size) {
        try {
            return font.widthOfTextAtSize(String(text), size);
        } catch (error) {
            return String(text).length * size * 0.55;
        }
    }

    function firstText() {
        for (let index = 0; index < arguments.length; index += 1) {
            const value = arguments[index];

            if (value === undefined || value === null) {
                continue;
            }

            const text = String(value).trim();
            if (text) {
                return text;
            }
        }

        return '';
    }

    function humanizeKey(value) {
        return String(value)
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .replace(/[_-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/^./, function upper(character) {
                return character.toUpperCase();
            });
    }

    function finiteOrZero(value) {
        return Number.isFinite(value) ? value : 0;
    }

    function finiteOrDefault(value, fallback) {
        return Number.isFinite(value) ? value : fallback;
    }

    function supportsRoundedRectangle() {
        return false;
    }

    function validateDependencies() {
        if (
            !globalScope.PDFLib ||
            typeof globalScope.PDFLib.rgb !== 'function'
        ) {
            throw createError(
                'PDFLib.rgb() is not available.'
            );
        }

        if (
            !engine.design ||
            !isPlainObject(engine.design.TOKENS)
        ) {
            throw createError(
                'Design System is not initialized.'
            );
        }
    }

    function validateBlock(block) {
        if (!isPlainObject(block)) {
            throw createError('block must be an object.');
        }

        if (
            typeof block.id !== 'string' ||
            block.id.trim().length === 0
        ) {
            throw createError('block.id must be a non-empty string.');
        }

        ['x', 'y', 'width', 'height'].forEach(function validateField(field) {
            if (!Number.isFinite(block[field])) {
                throw createError(
                    'block.' + field + ' must be a finite number.'
                );
            }
        });

        if (block.width <= 0 || block.height <= 0) {
            throw createError(
                'block width and height must be greater than zero.'
            );
        }
    }

    function validateRenderContext(renderContext) {
        if (!isPlainObject(renderContext)) {
            throw createError(
                'renderContext must be an object.'
            );
        }

        if (
            !renderContext.page ||
            typeof renderContext.page.drawText !== 'function' ||
            typeof renderContext.page.drawRectangle !== 'function'
        ) {
            throw createError(
                'renderContext.page must be a PDFLib page.'
            );
        }

        if (!isPlainObject(renderContext.fonts)) {
            throw createError(
                'renderContext.fonts must be an object.'
            );
        }
    }

    function isPlainObject(value) {
        if (
            value === null ||
            typeof value !== 'object' ||
            Array.isArray(value)
        ) {
            return false;
        }

        const prototype = Object.getPrototypeOf(value);
        return prototype === Object.prototype ||
            prototype === null;
    }

    function createError(message) {
        return new Error(
            MODULE_NAME + ': ' + message
        );
    }

    engine.blockRenderers = Object.freeze({
        version: VERSION,
        header: renderHeader,
        stats: renderStats,
        summary: renderSummary,
        metrics: renderMetrics,
        insights: renderInsights,
        decisions: renderDecisions,
        risks: renderRisks,
        tasks: renderTasks,
        architecture: renderArchitecture,
        owners: renderOwners,
        footer: renderFooter
    });

    globalScope.ExecutiveSlideEngine = engine;

})(
    typeof window !== 'undefined'
        ? window
        : globalThis
);
