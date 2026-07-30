/**
 * MeetMind Executive PDF Engine
 * Header Renderer
 *
 * Status: READY FOR GITHUB
 */

'use strict';

module.exports = function renderHeader(block, ctx) {

    const geometry = block.geometry;
    const data = block.data ?? {};
    const tokens = ctx.tokens ?? {};

    const typography = {
        title: tokens.typography?.headerTitle ?? {
            font: 'Helvetica-Bold',
            size: 22,
            lineHeight: 28,
            color: '#111827'
        },

        subtitle: tokens.typography?.headerSubtitle ?? {
            font: 'Helvetica',
            size: 11,
            lineHeight: 16,
            color: '#6B7280'
        },

        page: tokens.typography?.headerPage ?? {
            font: 'Helvetica',
            size: 10,
            lineHeight: 14,
            color: '#6B7280'
        }
    };

    const spacing = {
        paddingX: tokens.spacing?.headerPaddingX ?? 24,
        paddingTop: tokens.spacing?.headerPaddingTop ?? 14,
        subtitleGap: tokens.spacing?.headerSubtitleGap ?? 6
    };

    ctx.rect({
        x: geometry.x,
        y: geometry.y,
        width: geometry.width,
        height: geometry.height,

        fill: '#FFFFFF',
        stroke: '#E5E7EB',
        radius: 14
    });

    const title =
        data.title ??
        data.headline ??
        'Executive Meeting Report';

    const subtitle =
        data.subtitle ??
        data.meeting_type ??
        '';

    ctx.text(title, {
        x: geometry.x + spacing.paddingX,
        y: geometry.y + spacing.paddingTop,
        width: geometry.width - 180,
        height: typography.title.lineHeight,

        font: typography.title.font,
        size: typography.title.size,
        color: typography.title.color,
        lineHeight: typography.title.lineHeight,

        align: 'left',
        valign: 'top',
        wrap: false
    });

    if (subtitle) {

        ctx.text(subtitle, {
            x: geometry.x + spacing.paddingX,
            y:
                geometry.y +
                spacing.paddingTop +
                typography.title.lineHeight +
                spacing.subtitleGap,

            width: geometry.width - 180,
            height: typography.subtitle.lineHeight,

            font: typography.subtitle.font,
            size: typography.subtitle.size,
            color: typography.subtitle.color,
            lineHeight: typography.subtitle.lineHeight,

            align: 'left',
            valign: 'top',
            wrap: false
        });

    }

    if (block.pageNumber > 1) {

        ctx.text(`Page ${block.pageNumber}`, {

            x: geometry.x + geometry.width - 90,
            y: geometry.y + spacing.paddingTop,

            width: 70,
            height: typography.page.lineHeight,

            font: typography.page.font,
            size: typography.page.size,
            color: typography.page.color,
            lineHeight: typography.page.lineHeight,

            align: 'right',
            valign: 'top',
            wrap: false

        });

    }

};
