/**
 * MeetMind Executive PDF Engine
 * Architecture Renderer
 *
 * Status: READY FOR GITHUB
 */

'use strict';

const {
    drawCard,
    drawSectionTitle,
    getContentRect
} = require('./card-renderer');

module.exports = function renderArchitecture(block, ctx) {

    const geometry = block.geometry;
    const data = block.data ?? {};
    const tokens = ctx.tokens ?? {};

    drawCard(ctx, geometry);

    drawSectionTitle(
        ctx,
        geometry,
        data.title ?? 'Architecture'
    );

    const body = getContentRect(ctx, geometry);

    const nodes =
        Array.isArray(data.nodes)
            ? data.nodes
            : [];

    if (!nodes.length) {

        renderEmpty(body, ctx, tokens);
        return;

    }

    const cols = 4;

    const spacing = {

        gap:
            tokens.spacing?.architectureGap ??
            8,

        radius:
            tokens.radius?.architecture ??
            8

    };

    const typography =
        tokens.typography?.architectureNode ?? {

            font: 'Helvetica',
            size: 10,
            lineHeight: 14,
            color: '#374151'

        };

    const cellWidth =
        (
            body.width -
            spacing.gap * (cols - 1)
        ) / cols;

    const cellHeight = 36;

    nodes
        .slice(0, 16)
        .forEach((node, index) => {

            const row = Math.floor(index / cols);
            const col = index % cols;

            const x =
                body.x +
                col * (cellWidth + spacing.gap);

            const y =
                body.y +
                row * (cellHeight + spacing.gap);

            ctx.rect({

                x,
                y,

                width: cellWidth,
                height: cellHeight,

                fill: '#F9FAFB',
                stroke: '#D1D5DB',
                radius: spacing.radius

            });

            ctx.text(

                String(
                    node.label ??
                    node.name ??
                    ''
                ),

                {

                    x: x + 6,
                    y: y + 10,

                    width: cellWidth - 12,
                    height: typography.lineHeight,

                    font: typography.font,
                    size: typography.size,
                    color: typography.color,
                    lineHeight: typography.lineHeight,

                    align: 'center',
                    valign: 'middle',
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

        'No architecture data',

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
