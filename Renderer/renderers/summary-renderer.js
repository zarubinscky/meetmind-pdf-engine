/**
 * MeetMind Executive PDF Engine
 * Summary Renderer
 *
 * Status: READY FOR GITHUB
 */

'use strict';

const {
    drawCard,
    drawSectionTitle,
    getContentRect
} = require('./card-renderer');

module.exports = function renderSummary(block, ctx) {

    const geometry = block.geometry;
    const data = block.data ?? {};
    const tokens = ctx.tokens ?? {};

    drawCard(ctx, geometry);
    drawSectionTitle(ctx, geometry, 'Executive Summary');

    const body = getContentRect(ctx, geometry);

    const typography =
        tokens.typography?.body ?? {
            font: 'Helvetica',
            size: 12,
            lineHeight: 18,
            color: '#374151'
        };

    const text =
        data.summary ??
        data.text ??
        data.value ??
        data.description ??
        '';

    ctx.text(String(text), {
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
        wrap: true
    });

};
