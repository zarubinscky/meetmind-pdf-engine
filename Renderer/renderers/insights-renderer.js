/**
 * MeetMind Executive PDF Engine
 * Insights Renderer
 *
 * Status: READY FOR GITHUB
 */

'use strict';

const renderList = require('./list-renderer');

module.exports = function renderInsights(block, ctx) {

    block.data = {
        ...(block.data ?? {}),
        title: 'Insights'
    };

    return renderList(block, ctx);

};
