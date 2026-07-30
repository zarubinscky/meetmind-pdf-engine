/**
 * MeetMind Executive PDF Engine
 * Generic List Renderer
 *
 * Status: READY FOR GITHUB
 */

'use strict';

const {
    drawCard,
    drawSectionTitle,
    getContentRect
} = require('./card-renderer');

module.exports = function renderList(block, ctx) {

    const geometry = block.geometry;
    const data = block.data ?? {};
    const tokens = ctx.tokens ?? {};

    drawCard(ctx, geometry);

    const title =
        data.title ??
        block.title ??
        capitalize(block.id ?? 'Section');

    drawSectionTitle(ctx, geometry, title);

    const body = getContentRect(ctx, geometry);

    const typography = {
        title: tokens.typography?.listTitle ?? {
            font: 'Helvetica-Bold',
            size: 12,
            lineHeight: 18,
            color: '#111827'
        },

        body: tokens.typography?.listBody ?? {
            font: 'Helvetica',
            size: 11,
            lineHeight: 16,
            color: '#4B5563'
        },

        empty: tokens.typography?.listEmpty ?? {
            font: 'Helvetica',
            size: 11,
            lineHeight: 16,
            color: '#9CA3AF'
        }
    };

    const spacing = {
        indent: tokens.spacing?.listIndent ?? 16,
        itemGap: tokens.spacing?.listItemGap ?? 6
    };

    const items =
        Array.isArray(data.items)
            ? data.items
            : Array.isArray(data)
                ? data
                : [];

    if (!items.length) {

        ctx.text('No data', {
            x: body.x,
            y: body.y,
            width: body.width,
            height: body.height,

            font: typography.empty.font,
            size: typography.empty.size,
            color: typography.empty.color,
            lineHeight: typography.empty.lineHeight,

            align: 'left',
            valign: 'top',
            wrap: true
        });

        return;
    }

    let y = body.y;

    for (const item of items) {

        const itemTitle =
            item.title ??
            item.name ??
            item.task ??
            item.label ??
            '';

        const itemDescription =
            item.description ??
            item.details ??
            item.text ??
            '';

        ctx.text(`• ${itemTitle}`, {
            x: body.x,
            y,
            width: body.width,
            height: typography.title.lineHeight,

            font: typography.title.font,
            size: typography.title.size,
            color: typography.title.color,
            lineHeight: typography.title.lineHeight,

            align: 'left',
            valign: 'top',
            wrap: false
        });

        y += typography.title.lineHeight;

        if (itemDescription) {

            ctx.text(itemDescription, {
                x: body.x + spacing.indent,
                y,
                width: body.width - spacing.indent,
                height: typography.body.lineHeight * 2,

                font: typography.body.font,
                size: typography.body.size,
                color: typography.body.color,
                lineHeight: typography.body.lineHeight,

                align: 'left',
                valign: 'top',
                wrap: true
            });

            y += typography.body.lineHeight * 2;
        }

        y += spacing.itemGap;
    };

};

function capitalize(value) {

    if (!value) {
        return '';
    }

    return value.charAt(0).toUpperCase() + value.slice(1);

}
