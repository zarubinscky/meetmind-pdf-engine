/**
 * MeetMind Executive PDF Engine
 * Decisions Renderer
 *
 * Status: READY FOR GITHUB
 */

'use strict';

const renderList = require('./list-renderer');

module.exports = function renderDecisions(block, ctx) {

    block.data = {
        ...(block.data ?? {}),
        title: 'Decisions'
    };

    return renderList(block, ctx);

};
