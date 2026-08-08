/**
 * MeetMind Executive PDF Engine
 * Layout Engine — Golden Implementation v1.0
 *
 * Public contract preserved:
 *   MeetMindLayoutEngine.layout(compositionResult, options?)
 *
 * Responsibilities:
 * - content-driven geometry
 * - Regular -> Compact -> Dense fit evaluation
 * - deterministic page geometry on the canonical 768 x 512 pt canvas
 * - no clipping/truncation/content deletion
 *
 * Golden reference geometry is used as a target, never as fixture-specific branching.
 */
(function (global) {
    'use strict';

    const PAGE = Object.freeze({ width: 768, height: 512 });

    const MODES = Object.freeze({
        regular: Object.freeze({
            marginX: 10, marginTop: 9, marginBottom: 8,
            sectionGap: 6, cardGap: 5, columnGap: 5,
            padX: 8, padY: 7, lineGap: 3,
            body: 8.0, bodyLine: 10.0, small: 6.8, smallLine: 8.4,
            blockTitle: 8.5, blockTitleLine: 10.5,
            taskHeader: 6.6, taskBody: 6.8, taskLine: 8.2
        }),
        compact: Object.freeze({
            marginX: 10, marginTop: 8, marginBottom: 7,
            sectionGap: 4.5, cardGap: 4, columnGap: 4,
            padX: 7, padY: 5.5, lineGap: 2.2,
            body: 7.4, bodyLine: 9.0, small: 6.4, smallLine: 7.8,
            blockTitle: 8.0, blockTitleLine: 9.6,
            taskHeader: 6.2, taskBody: 6.4, taskLine: 7.6
        }),
        dense: Object.freeze({
            marginX: 10, marginTop: 7, marginBottom: 6,
            sectionGap: 3, cardGap: 3, columnGap: 3,
            padX: 6, padY: 4.5, lineGap: 1.5,
            body: 6.8, bodyLine: 8.0, small: 6.0, smallLine: 7.0,
            blockTitle: 7.4, blockTitleLine: 8.8,
            taskHeader: 5.9, taskBody: 6.0, taskLine: 7.0
        })
    });

    const ORDER = [
        'header', 'meetingStats', 'executiveSummary', 'keyMetrics',
        'insights', 'decisions', 'risks', 'tasks', 'architecture',
        'owners', 'footer'
    ];

    const aliases = Object.freeze({
        summary: 'executiveSummary',
        metrics: 'keyMetrics',
        stats: 'meetingStats'
    });

    function idOf(block) {
        return aliases[block?.id] || block?.id || block?.type || '';
    }

    function cleanText(value) {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return String(value).replace(/\s+/g, ' ').trim();
        }
        return '';
    }

    function textOf(value) {
        if (value === null || value === undefined) return '';
        if (typeof value !== 'object') return cleanText(value);
        for (const key of ['text','summary','description','title','label','value','task','name','role','owner','dueDate','due_date']) {
            const v = cleanText(value[key]);
            if (v) return v;
        }
        return '';
    }

    function arrayOf(block) {
        const c = block?.content ?? block?.data ?? block?.items ?? block?.value;
        if (Array.isArray(c)) return c;
        if (c && typeof c === 'object') {
            for (const key of ['items','metrics','tasks','sections','owners','participants','values']) {
                if (Array.isArray(c[key])) return c[key];
            }
        }
        return [];
    }

    // Deterministic font-independent estimate. Renderer performs the final glyph drawing.
    // Layout intentionally errs slightly high so content is never clipped.
    function charsPerLine(width, fontSize) {
        return Math.max(8, Math.floor(width / Math.max(2.8, fontSize * 0.53)));
    }

    function lineCount(text, width, fontSize) {
        const s = cleanText(text);
        if (!s) return 0;
        const cap = charsPerLine(width, fontSize);
        const words = s.split(' ');
        let lines = 1, used = 0;
        for (const word of words) {
            const n = word.length + (used ? 1 : 0);
            if (used && used + n > cap) {
                lines += Math.max(1, Math.ceil(word.length / cap));
                used = Math.min(word.length, cap);
            } else if (!used && word.length > cap) {
                lines += Math.ceil(word.length / cap) - 1;
                used = word.length % cap;
            } else {
                used += n;
            }
        }
        return lines;
    }

    function blockChrome(mode) {
        return mode.padY * 2 + mode.blockTitleLine + mode.lineGap;
    }

    function measureList(block, width, mode) {
        const items = arrayOf(block);
        const inner = Math.max(40, width - mode.padX * 2 - 18);
        let h = blockChrome(mode);
        for (const item of items) {
            const title = cleanText(item?.title || item?.label || '');
            const body = cleanText(item?.description || item?.text || item?.value || textOf(item));
            const titleLines = title ? lineCount(title, inner, mode.body) : 0;
            const bodyLines = body && body !== title ? lineCount(body, inner, mode.small) : 0;
            h += Math.max(mode.bodyLine, titleLines * mode.bodyLine + bodyLines * mode.smallLine);
            h += mode.lineGap;
        }
        return Math.max(32, h);
    }

    function measureSummary(block, width, mode) {
        const c = block?.content ?? block?.data ?? block?.value ?? '';
        let paragraphs = [];
        if (Array.isArray(c)) paragraphs = c.map(textOf).filter(Boolean);
        else if (typeof c === 'object') {
            const raw = c.paragraphs || c.items;
            paragraphs = Array.isArray(raw) ? raw.map(textOf).filter(Boolean) : [textOf(c)].filter(Boolean);
        } else paragraphs = [cleanText(c)].filter(Boolean);

        const inner = Math.max(50, width - mode.padX * 2);
        let lines = 0;
        for (const p of paragraphs) lines += lineCount(p, inner, mode.body);
        return Math.max(42, blockChrome(mode) + lines * mode.bodyLine + Math.max(0, paragraphs.length - 1) * mode.lineGap);
    }

    function measureMetrics(block, width, mode) {
        const items = arrayOf(block);
        if (!items.length) return 0;
        const columns = width >= 300 ? 4 : width >= 200 ? 3 : 2;
        const rows = Math.ceil(items.length / columns);
        const cellW = (width - (columns - 1) * mode.cardGap) / columns;
        let total = 0;
        for (let r = 0; r < rows; r++) {
            let rowH = 0;
            for (let c = 0; c < columns; c++) {
                const item = items[r * columns + c];
                if (!item) continue;
                const label = cleanText(item.label || item.title || item.name);
                const value = cleanText(item.value || item.primaryValue || item.metric);
                const h = mode.padY * 2
                    + Math.max(mode.bodyLine * 1.6, lineCount(value, cellW - mode.padX * 2, mode.body * 1.45) * mode.bodyLine)
                    + lineCount(label, cellW - mode.padX * 2, mode.small) * mode.smallLine;
                rowH = Math.max(rowH, h);
            }
            total += rowH + (r ? mode.cardGap : 0);
        }
        return Math.max(36, blockChrome(mode) + total);
    }

    function measureTasks(block, width, mode) {
        const items = arrayOf(block);
        const taskW = Math.max(80, width * 0.58);
        let h = blockChrome(mode) + 14; // table header
        for (const item of items) {
            const task = cleanText(item.task || item.title || item.description || item.text);
            const owner = cleanText(item.owner?.name || item.owner || '');
            const due = cleanText(item.dueDate || item.due_date || item.deadline || '');
            const lines = Math.max(
                1,
                lineCount(task, taskW, mode.taskBody),
                lineCount(owner, width * 0.22, mode.taskBody),
                lineCount(due, width * 0.16, mode.taskBody)
            );
            h += Math.max(13, lines * mode.taskLine + mode.padY);
        }
        return Math.max(42, h);
    }

    function measureArchitecture(block, width, mode) {
        const sections = arrayOf(block);
        if (!sections.length) return 0;
        const cols = Math.min(4, Math.max(1, sections.length));
        const colW = (width - (cols - 1) * mode.cardGap) / cols;
        let max = 0;
        for (const section of sections) {
            const title = cleanText(section.title || section.name || section.label);
            const items = Array.isArray(section.items) ? section.items : [];
            let h = mode.padY * 2 + lineCount(title, colW - mode.padX * 2, mode.body) * mode.bodyLine + mode.lineGap;
            for (const item of items) {
                const it = cleanText(item.title || item.name || item.label);
                const desc = cleanText(item.description || item.text || '');
                h += Math.max(mode.bodyLine, lineCount(it, colW - mode.padX * 2, mode.small) * mode.smallLine);
                if (desc) h += lineCount(desc, colW - mode.padX * 2, mode.small) * mode.smallLine;
                h += mode.lineGap;
            }
            max = Math.max(max, h);
        }
        return Math.max(42, blockChrome(mode) + max);
    }

    function measureOwners(block, width, mode) {
        const items = arrayOf(block);
        if (!items.length) return 0;
        const perRow = Math.max(1, Math.floor(width / 110));
        const rows = Math.ceil(items.length / perRow);
        return blockChrome(mode) + rows * (mode === MODES.dense ? 22 : 26) + Math.max(0, rows - 1) * mode.cardGap;
    }

    function measure(block, width, mode) {
        const id = idOf(block);
        switch (id) {
            case 'header': return 36;
            case 'meetingStats': return 25;
            case 'executiveSummary': return measureSummary(block, width, mode);
            case 'keyMetrics': return measureMetrics(block, width, mode);
            case 'insights':
            case 'decisions':
            case 'risks': return measureList(block, width, mode);
            case 'tasks': return measureTasks(block, width, mode);
            case 'architecture': return measureArchitecture(block, width, mode);
            case 'owners': return measureOwners(block, width, mode);
            case 'footer': return 17;
            default: return measureList(block, width, mode);
        }
    }

    function getBlocks(composition) {
        if (Array.isArray(composition?.blocks)) return composition.blocks;
        if (Array.isArray(composition?.pages)) {
            return composition.pages.flatMap(p => Array.isArray(p.blocks) ? p.blocks : []);
        }
        return [];
    }

    function byId(blocks) {
        const map = new Map();
        for (const block of blocks) {
            const id = idOf(block);
            if (id && !map.has(id)) map.set(id, block);
        }
        return map;
    }

    function cloneWithGeometry(block, geometry, meta = {}) {
        return Object.assign({}, block, {
            geometry: Object.freeze({
                x: geometry.x, y: geometry.y,
                width: geometry.width, height: geometry.height
            }),
            layout: Object.freeze(meta)
        });
    }

    function buildPage(blocks, modeName) {
        const mode = MODES[modeName];
        const map = byId(blocks);
        const x = mode.marginX;
        const contentW = PAGE.width - mode.marginX * 2;
        const pageBlocks = [];
        let y = mode.marginTop;

        const placeFull = (id, forcedH = null) => {
            const b = map.get(id);
            if (!b) return 0;
            const h = forcedH ?? measure(b, contentW, mode);
            pageBlocks.push(cloneWithGeometry(b, { x, y, width: contentW, height: h }, { density: modeName }));
            y += h + mode.sectionGap;
            return h;
        };

        placeFull('header', 36);
        placeFull('meetingStats', 25);

        // Golden row 1: Summary | Metrics. Width ratio is a visual token, height remains content-driven.
        const summary = map.get('executiveSummary');
        const metrics = map.get('keyMetrics');
        if (summary && metrics) {
            const gap = mode.columnGap;
            const leftW = (contentW - gap) * 0.435;
            const rightW = contentW - gap - leftW;
            const h1 = measure(summary, leftW, mode);
            const h2 = measure(metrics, rightW, mode);
            const rowH = Math.max(h1, h2);
            pageBlocks.push(cloneWithGeometry(summary, { x, y, width: leftW, height: rowH }, { density: modeName, naturalHeight: h1 }));
            pageBlocks.push(cloneWithGeometry(metrics, { x: x + leftW + gap, y, width: rightW, height: rowH }, { density: modeName, naturalHeight: h2 }));
            y += rowH + mode.sectionGap;
        } else {
            if (summary) placeFull('executiveSummary');
            if (metrics) placeFull('keyMetrics');
        }

        // Golden row 2: Insights | Decisions | Risks. Equal visual columns; row height is max natural content height.
        const trio = ['insights','decisions','risks'].filter(id => map.has(id));
        if (trio.length) {
            const gap = mode.columnGap;
            const colW = (contentW - gap * (trio.length - 1)) / trio.length;
            const hs = trio.map(id => measure(map.get(id), colW, mode));
            const rowH = Math.max(...hs);
            trio.forEach((id, i) => {
                pageBlocks.push(cloneWithGeometry(
                    map.get(id),
                    { x: x + i * (colW + gap), y, width: colW, height: rowH },
                    { density: modeName, naturalHeight: hs[i] }
                ));
            });
            y += rowH + mode.sectionGap;
        }

        // Golden row 3: Tasks | Architecture, 39/61.
        const tasks = map.get('tasks');
        const architecture = map.get('architecture');
        if (tasks && architecture) {
            const gap = mode.columnGap;
            const leftW = (contentW - gap) * 0.39;
            const rightW = contentW - gap - leftW;
            const h1 = measure(tasks, leftW, mode);
            const h2 = measure(architecture, rightW, mode);
            const rowH = Math.max(h1, h2);
            pageBlocks.push(cloneWithGeometry(tasks, { x, y, width: leftW, height: rowH }, { density: modeName, naturalHeight: h1 }));
            pageBlocks.push(cloneWithGeometry(architecture, { x: x + leftW + gap, y, width: rightW, height: rowH }, { density: modeName, naturalHeight: h2 }));
            y += rowH + mode.sectionGap;
        } else {
            if (tasks) placeFull('tasks');
            if (architecture) placeFull('architecture');
        }

        placeFull('owners');
        // Footer belongs at the bottom if everything fits; otherwise its natural position is preserved for pagination.
        const footer = map.get('footer');
        if (footer) {
            const h = 17;
            const bottomY = PAGE.height - mode.marginBottom - h;
            const fy = Math.max(y, bottomY);
            pageBlocks.push(cloneWithGeometry(footer, { x, y: fy, width: contentW, height: h }, { density: modeName }));
            y = fy + h;
        }

        const usedHeight = y + mode.marginBottom;
        return {
            mode: modeName,
            blocks: pageBlocks,
            usedHeight,
            fits: usedHeight <= PAGE.height + 0.01
        };
    }

    function paginateSequential(blocks, modeName) {
        const mode = MODES[modeName];
        const contentW = PAGE.width - mode.marginX * 2;
        const maxY = PAGE.height - mode.marginBottom;
        const pages = [];
        let current = [], y = mode.marginTop;

        const pushPage = () => {
            if (!current.length) return;
            pages.push({
                id: `page-${pages.length + 1}`,
                number: pages.length + 1,
                index: pages.length,
                size: PAGE,
                blocks: current
            });
            current = [];
            y = mode.marginTop;
        };

        for (const block of blocks) {
            const h = measure(block, contentW, mode);
            if (current.length && y + h > maxY) pushPage();
            current.push(cloneWithGeometry(block, {
                x: mode.marginX, y,
                width: contentW,
                height: Math.min(h, maxY - mode.marginTop)
            }, { density: modeName, paginated: true, naturalHeight: h }));
            y += h + mode.sectionGap;
        }
        pushPage();
        return pages;
    }

    function validate(pages) {
        const diagnostics = [];
        for (const page of pages) {
            for (const block of page.blocks) {
                const g = block.geometry;
                if (!g || g.width <= 0 || g.height <= 0) {
                    diagnostics.push({ level: 'error', code: 'INVALID_GEOMETRY', blockId: idOf(block) });
                }
                if (g && (g.x < 0 || g.y < 0 || g.x + g.width > PAGE.width + .1 || g.y + g.height > PAGE.height + .1)) {
                    diagnostics.push({ level: 'warning', code: 'OUTSIDE_PAGE', blockId: idOf(block), geometry: g });
                }
            }
        }
        return diagnostics;
    }

    function layout(composition, options = {}) {
        const blocks = getBlocks(composition)
            .filter(Boolean)
            .sort((a, b) => {
                const ai = ORDER.indexOf(idOf(a)), bi = ORDER.indexOf(idOf(b));
                return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
            });

        if (!blocks.length) {
            return Object.freeze({
                pageCount: 0, valid: true, density: 'regular',
                pages: Object.freeze([]), diagnostics: Object.freeze([])
            });
        }

        let selected = null;
        const attempts = [];
        for (const modeName of ['regular','compact','dense']) {
            const attempt = buildPage(blocks, modeName);
            attempts.push({ density: modeName, usedHeight: attempt.usedHeight, fits: attempt.fits });
            if (attempt.fits) {
                selected = attempt;
                break;
            }
        }

        let pages;
        let density;
        if (selected) {
            density = selected.mode;
            pages = [{
                id: 'page-1', number: 1, index: 0,
                kind: 'executive',
                size: PAGE,
                blocks: selected.blocks
            }];
        } else {
            density = 'dense';
            pages = paginateSequential(blocks, density);
        }

        const diagnostics = validate(pages);
        return Object.freeze({
            pageCount: pages.length,
            valid: !diagnostics.some(d => d.level === 'error'),
            density,
            size: PAGE,
            pages: Object.freeze(pages.map(p => Object.freeze(p))),
            diagnostics: Object.freeze(diagnostics),
            attempts: Object.freeze(attempts)
        });
    }

    global.MeetMindLayoutEngine = Object.freeze({
        version: 'golden-1.0.0',
        PAGE,
        MODES,
        layout
    });

})(window);
