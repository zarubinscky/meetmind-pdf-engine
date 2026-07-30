/**
 * MeetMind Executive PDF Engine
 * Shared Card Renderer
 *
 * Status: READY FOR GITHUB
 */

'use strict';

function resolveCardStyle(tokens = {}) {
    return {
        padding: tokens.spacing?.cardPadding ?? 18,
        radius: tokens.radius?.card ?? 14,

        background: tokens.colors?.cardBackground ?? '#FFFFFF',
        borderColor: tokens.colors?.cardBorder ?? '#E5E7EB',

        title: tokens.typography?.sectionTitle ?? {
            font: 'Helvetica-Bold',
            size: 16,
            lineHeight: 20,
            color: '#111827'
        },

        body: tokens.typography?.body ?? {
            font: 'Helvetica',
            size: 11,
            lineHeight: 16,
            color: '#374151'
        },

        titleGap: tokens.spacing?.titleGap ?? 12
    };
}

function drawCard(ctx, geometry) {
    const style = resolveCardStyle(ctx.tokens);

    ctx.rect({
        x: geometry.x,
        y: geometry.y,
        width: geometry.width,
        height: geometry.height,

        color: style.background,
        borderColor: style.borderColor,
        borderWidth: 1,
        radius: style.radius
    });
}

function drawSectionTitle(ctx, geometry, title) {
    const style = resolveCardStyle(ctx.tokens);

    ctx.text(String(title ?? ''), {
        x: geometry.x + style.padding,
        y: geometry.y + style.padding,

        width: geometry.width - style.padding * 2,
        height: style.title.lineHeight,

        font: style.title.font,
        size: style.title.size,
        color: style.title.color,
        lineHeight: style.title.lineHeight,

        align: 'left',
        valign: 'top',
        wrap: false
    });
}

function getContentRect(ctx, geometry) {
    const style = resolveCardStyle(ctx.tokens);

    const top =
        style.padding +
        style.title.lineHeight +
        style.titleGap;

    return {
        x: geometry.x + style.padding,
        y: geometry.y + top,
        width: geometry.width - style.padding * 2,
        height: geometry.height - top - style.padding
    };
}

module.exports = {
    drawCard,
    drawSectionTitle,
    getContentRect
};
