/**
 * MeetMind Executive PDF Engine
 * Owners Renderer
 *
 * Status: READY FOR GITHUB
 */

'use strict';

const renderList = require('./list-renderer');

module.exports = function renderOwners(block, ctx) {

    block.data = {
        ...(block.data ?? {}),
        title: 'Owners'
    };

    return renderList(block, ctx);

};
