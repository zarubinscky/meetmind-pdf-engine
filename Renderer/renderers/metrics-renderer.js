/**
 * MeetMind Executive PDF Engine
 * Metrics Renderer
 *
 * Status: READY FOR GITHUB
 */

'use strict';

const {
    drawCard,
    drawSectionTitle,
    getContentRect
} = require('./card-renderer');

module.exports = function renderMetrics(block, ctx) {

    const geometry = block.geometry;
    const data = block.data ?? {};
    const tokens = ctx.tokens ?? {};

    drawCard(ctx, geometry);

    drawSectionTitle(
        ctx,
        geometry,
        data.title ?? 'Key Metrics'
    );

    const body = getContentRect(ctx, geometry);

    const metrics =
        Array.isArray(data.metrics)
            ? data.metrics
            : Array.isArray(data.items)
                ? data.items
                : [];

    if (!metrics.length) {

        renderEmpty(body, ctx, tokens);
        return;

    }

    const spacing = {

        gap:
            tokens.spacing?.metricGap ??
            10,

        cardRadius:
            tokens.radius?.metric ??
            10

    };

    const typography = {

        value:
            tokens.typography?.metricValue ?? {

                font: 'Helvetica-Bold',
                size: 22,
                lineHeight: 26,
                color: '#111827'

            },

        label:
            tokens.typography?.metricLabel ?? {

                font: 'Helvetica',
                size: 10,
                lineHeight: 14,
                color: '#6B7280'

            }

    };

    const cardCount = Math.min(metrics.length, 4);

    const cardWidth =
        (
            body.width -
            spacing.gap * (cardCount - 1)
        ) / cardCount;

    const cardHeight = 70;

    metrics
        .slice(0, cardCount)
        .forEach((metric, index) => {

            const x =
                body.x +
                index * (cardWidth + spacing.gap);

            const y = body.y;

            ctx.rect({

                x,
                y,

                width: cardWidth,
                height: cardHeight,

                fill: '#F9FAFB',
                stroke: '#E5E7EB',
                radius: spacing.cardRadius

            });

            ctx.text(
                String(metric.value ?? ''),
                {

                    x: x + 12,
                    y: y + 14,

                    width: cardWidth - 24,
                    height: typography.value.lineHeight,

                    font: typography.value.font,
                    size: typography.value.size,
                    color: typography.value.color,
                    lineHeight: typography.value.lineHeight,

                    align: 'left',
                    valign: 'top',
                    wrap: false

                }
            );

            ctx.text(
                String(
                    metric.label ??
                    metric.title ??
                    ''
                ),
                {

                    x: x + 12,
                    y: y + 44,

                    width: cardWidth - 24,
                    height: typography.label.lineHeight,

                    font: typography.label.font,
                    size: typography.label.size,
                    color: typography.label.color,
                    lineHeight: typography.label.lineHeight,

                    align: 'left',
                    valign: 'top',
                    wrap: false

                }
            );

        });

};

function renderEmpty(body, ctx, tokens) {

    const typography =
        tokens.typography?.empty ?? {

            font: 'Helvetica',
            size: 11,
            lineHeight: 16,
            color: '#9CA3AF'

        };

    ctx.text(
        'No metrics',
        {

            x: body.x,
            y: body.y,

            width: body.width,
            height: body.height,

            font: typography.font,
            size: typography.size,
            color: typography.color,
            lineHeight: typography.lineHeight,

            align: 'left',
            valign: 'top',
            wrap: false

        }
    );

}
