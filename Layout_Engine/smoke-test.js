'use strict';

const assert = require('assert');
const engine = require('./layout-engine.js');

function makeList(prefix, count) {
    return Array.from({ length: count }, (_, index) => ({
        title: `${prefix} ${index + 1}`,
        details: 'Краткое описание результата и следующего действия.'
    }));
}

const composition = {
    density: 'regular',
    pages: [{
        number: 1,
        template: 'dominant-insights',
        blocks: [
            { id: 'header', data: { title: 'Architecture Review' } },
            { id: 'stats', data: { participants: 8 } },
            {
                id: 'summary',
                data: { text: 'Согласован новый компактный PDF Engine.' }
            },
            { id: 'insights', data: { items: makeList('Insight', 3) } },
            { id: 'decisions', data: { items: makeList('Decision', 2) } },
            {
                id: 'tasks',
                data: {
                    rows: [
                        { task: 'Implement layout', owner: 'Team', due: '01.08' },
                        { task: 'Run review', owner: 'Founder', due: '02.08' }
                    ]
                }
            },
            {
                id: 'architecture',
                data: {
                    sections: [
                        {
                            title: 'Pipeline',
                            items: [
                                { title: 'Compose', description: 'Business rules' },
                                { title: 'Layout', description: 'Geometry' }
                            ]
                        }
                    ]
                }
            },
            { id: 'footer' }
        ]
    }]
};

const result = engine.layout(composition);

assert.strictEqual(result.engine.version, '0.3.0');
assert.strictEqual(result.valid, true);
assert.strictEqual(result.pages[0].template.applied, 'dominant-insights');
assert.ok(result.pages[0].regions.columns);
assert.ok(
    result.pages[0].blocks.some(
        block => block.id === 'insights' && block.column === 'left'
    )
);
assert.ok(
    result.pages[0].metrics.densityFallback &&
    Array.isArray(result.pages[0].metrics.densityFallback.attempted)
);

console.log('MeetMind Layout Engine 0.3 smoke test: PASSED');
