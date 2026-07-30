/**
 * MeetMind Executive PDF Engine
 * Risks Renderer
 *
 * Status: READY FOR GITHUB
 */

'use strict';

const renderList = require('./list-renderer');

module.exports = function renderRisks(block, ctx) {

    block.data = {
        ...(block.data ?? {}),
        title: 'Risks'
    };

    return renderList(block, ctx);

};
