/**
 * MeetMind Executive PDF Engine
 * Layout Engine — Golden Implementation v1.1 / REAL MEASUREMENT
 *
 * Public contract:
 *   MeetMindLayoutEngine.layout(compositionResult, options?)
 *
 * options.measureText(text, fontName, sizePt) is supplied by the browser
 * integration after Inter fonts have been registered in DrawingSurface.
 *
 * No clipping, maxLines, semantic ellipsis or fixture-specific branching.
 */
(function (global) {
    'use strict';

    const PAGE = Object.freeze({ width: 768, height: 512 });
    const ORDER = Object.freeze([
        'header', 'meetingStats', 'executiveSummary', 'keyMetrics',
        'insights', 'decisions', 'risks', 'tasks', 'architecture',
        'owners', 'footer'
    ]);
    const ALIASES = Object.freeze({
        stats: 'meetingStats',
        summary: 'executiveSummary',
        metrics: 'keyMetrics'
    });

    const FALLBACK_MODE = Object.freeze({
        regular: { marginX:10, marginTop:8, marginBottom:6, sectionGap:4, columnGap:4, cardGap:4, padX:8, padY:7, titleGap:5 },
        compact: { marginX:10, marginTop:7, marginBottom:6, sectionGap:3.5, columnGap:3.5, cardGap:3.5, padX:7, padY:6, titleGap:4 },
        dense:   { marginX:10, marginTop:6, marginBottom:5, sectionGap:3, columnGap:3, cardGap:3, padX:6, padY:5, titleGap:3 }
    });

    function idOf(block) {
        const id = block?.id || block?.type || '';
        return ALIASES[id] || id;
    }

    function getBlocks(composition) {
        if (Array.isArray(composition?.blocks)) return composition.blocks;
        if (Array.isArray(composition?.pages)) {
            return composition.pages.flatMap(page =>
                Array.isArray(page.blocks) ? page.blocks : []
            );
        }
        return [];
    }

    function clean(value) {
        if (value === null || value === undefined) return '';
        return String(value).replace(/\s+/g, ' ').trim();
    }

    function arrayFrom(block) {
        const data = block?.data ?? block?.content ?? block?.items ?? block?.value;
        if (Array.isArray(data)) return data;
        if (data && typeof data === 'object') {
            for (const key of ['items','metrics','tasks','sections','owners','participants','values']) {
                if (Array.isArray(data[key])) return data[key];
            }
        }
        return [];
    }

    function token(tokens, name, density, fallbackSize, fallbackLine, fallbackFont='regular') {
        const t = tokens?.typography?.tokens?.[name];
        if (!t) return { size:fallbackSize, lineHeight:fallbackLine, font:fallbackFont };
        const size = Number(t.size?.[density] ?? t.size?.regular ?? fallbackSize);
        const lineHeight = Number(t.lineHeight?.[density] ?? t.lineHeight?.regular ?? fallbackLine);
        return { size, lineHeight, font:t.font || fallbackFont };
    }

    function spacing(tokens, density) {
        const t = tokens?.spacing?.[density];
        const f = FALLBACK_MODE[density];
        return {
            marginX: Number(t?.pageMargin ?? f.marginX),
            marginTop: Number(t?.pageMarginTop ?? t?.pageMargin ?? f.marginTop),
            marginBottom: Number(t?.pageMarginBottom ?? f.marginBottom),
            sectionGap: Number(t?.sectionGap ?? f.sectionGap),
            columnGap: Number(t?.cardGap ?? t?.columnGap ?? f.columnGap),
            cardGap: Number(t?.cardGap ?? f.cardGap),
            padX: Number(t?.cardPaddingX ?? t?.cardPadding ?? f.padX),
            padY: Number(t?.cardPaddingY ?? t?.cardPadding ?? f.padY),
            titleGap: Number(t?.titleGap ?? f.titleGap),
            bulletGap: Number(t?.bulletGap ?? 2.5),
            paragraphGap: Number(t?.paragraphGap ?? 2.5)
        };
    }

    function makeMeasure(options) {
        const fn = typeof options?.measureText === 'function'
            ? options.measureText
            : null;
        return function width(text, font, size) {
            const s = clean(text);
            if (!s) return 0;
            if (fn) {
                const result = fn(s, font, size);
                if (Number.isFinite(result)) return result;
            }
            return s.length * size * 0.54;
        };
    }

    function wrap(text, maxWidth, style, measure) {
        const raw = String(text ?? '').replace(/\r\n?/g, '\n');
        if (!raw.trim()) return [];
        const out = [];

        for (const paragraph of raw.split('\n')) {
            if (!paragraph.trim()) {
                out.push('');
                continue;
            }

            const words = paragraph.trim().split(/\s+/);
            let line = '';

            for (const word of words) {
                const candidate = line ? `${line} ${word}` : word;
                if (!line || measure(candidate, style.font, style.size) <= maxWidth) {
                    if (measure(candidate, style.font, style.size) <= maxWidth) {
                        line = candidate;
                        continue;
                    }
                }

                if (line) {
                    out.push(line);
                    line = '';
                }

                // Long token: split without ellipsis or content loss.
                let fragment = '';
                for (const ch of Array.from(word)) {
                    const next = fragment + ch;
                    if (fragment && measure(next, style.font, style.size) > maxWidth) {
                        out.push(fragment);
                        fragment = ch;
                    } else {
                        fragment = next;
                    }
                }
                line = fragment;
            }
            if (line) out.push(line);
        }
        return out;
    }

    function sectionChrome(tokens, density, s) {
        const title = token(tokens, 'blockTitle', density, 8, 9, 'bold');
        return s.padY * 2 + title.lineHeight + s.titleGap;
    }

    function measureSummary(block, width, env) {
        const style = token(env.tokens, 'body', env.density, 6.3, 7.8);
        const inner = Math.max(20, width - env.s.padX * 2);
        let text = clean(block?.data ?? block?.content ?? block?.value ?? '');
        if (block?.data && typeof block.data === 'object') {
            text = clean(block.data.summary || block.data.text || block.data.description || text);
        }
        const lines = wrap(text, inner, style, env.measure);
        return Math.max(38, sectionChrome(env.tokens, env.density, env.s) + lines.length * style.lineHeight);
    }

    function measureList(block, width, env) {
        const strong = token(env.tokens, 'listStrong', env.density, 6.1, 7.4, 'semibold');
        const body = token(env.tokens, 'listBody', env.density, 6.1, 7.4);
        const inner = Math.max(20, width - env.s.padX * 2 - 14);
        let h = sectionChrome(env.tokens, env.density, env.s);

        for (const item of arrayFrom(block)) {
            const titleText = clean(item?.title || item?.label || item?.name || '');
            const description = clean(item?.description || item?.details || item?.text || '');
            const titleLines = wrap(titleText, inner, strong, env.measure).length;
            const descLines = description
                ? wrap(description, inner, body, env.measure).length
                : 0;
            h += titleLines * strong.lineHeight + descLines * body.lineHeight + env.s.bulletGap;
        }
        return Math.max(32, h);
    }

    function measureMetrics(block, width, env) {
        const metrics = arrayFrom(block);
        if (!metrics.length) return 0;
        const label = token(env.tokens, 'metricLabel', env.density, 5.2, 6.2, 'semibold');
        const value = token(env.tokens, 'metricValue', env.density, 8.5, 9.5, 'bold');
        const columns = Math.min(4, Math.max(1, metrics.length));
        const rows = Math.ceil(metrics.length / columns);
        const innerW = width - env.s.padX * 2;
        const cellW = (innerW - env.s.cardGap * (columns - 1)) / columns;
        let rowHeight = 0;

        for (const metric of metrics) {
            const labelText = clean(metric?.label || metric?.title || metric?.name || '');
            const valueText = clean(metric?.value || metric?.metric || metric?.amount || '—');
            const labelLines = Math.max(1, wrap(labelText, cellW - 8, label, env.measure).length);
            const valueLines = Math.max(1, wrap(valueText, cellW - 8, value, env.measure).length);
            rowHeight = Math.max(rowHeight,
                8 + labelLines * label.lineHeight + 3 + valueLines * value.lineHeight + 7
            );
        }

        return sectionChrome(env.tokens, env.density, env.s)
            + rows * rowHeight
            + Math.max(0, rows - 1) * env.s.cardGap;
    }

    function measureTasks(block, width, env) {
        const items = arrayFrom(block);
        const header = token(env.tokens, 'taskHeader', env.density, 4.8, 5.6, 'semibold');
        const cell = token(env.tokens, 'taskCell', env.density, 4.8, 5.8);
        const innerW = width - env.s.padX * 2;
        const noW = 14;
        const ownerW = innerW * 0.20;
        const dueW = Math.max(31, innerW * 0.17);
        const taskW = Math.max(50, innerW - noW - ownerW - dueW - 6);

        let h = sectionChrome(env.tokens, env.density, env.s) + header.lineHeight + 5;
        for (const item of items) {
            const taskText = clean(item?.task || item?.title || item?.description || item?.text);
            const owner = clean(item?.owner?.name || item?.owner || '');
            const due = clean(item?.dueDate || item?.due_date || item?.deadline || '');
            const lines = Math.max(
                1,
                wrap(taskText, taskW, cell, env.measure).length,
                wrap(owner, ownerW, cell, env.measure).length,
                wrap(due, dueW, cell, env.measure).length
            );
            h += Math.max(9, lines * cell.lineHeight + 3);
        }
        return Math.max(42, h);
    }

    function measureArchitecture(block, width, env) {
        const sections = arrayFrom(block);
        if (!sections.length) return 0;
        const secTitle = token(env.tokens, 'architectureSectionTitle', env.density, 5.9, 6.9, 'bold');
        const itemTitle = token(env.tokens, 'architectureItemTitle', env.density, 5.0, 5.8, 'semibold');
        const desc = token(env.tokens, 'architectureDescription', env.density, 4.7, 5.6);
        const cols = Math.min(4, sections.length);
        const innerW = width - env.s.padX * 2;
        const colW = (innerW - env.s.cardGap * (cols - 1)) / cols;
        let maxH = 0;

        for (const section of sections) {
            let h = 8;
            h += wrap(clean(section?.title || section?.name), colW - 10, secTitle, env.measure).length * secTitle.lineHeight + 4;

            for (const item of Array.isArray(section?.items) ? section.items : []) {
                const t = clean(item?.title || item?.name || item?.label);
                const d = clean(item?.description || item?.text || '');
                h += Math.max(1, wrap(t, colW - 12, itemTitle, env.measure).length) * itemTitle.lineHeight;
                if (d) h += wrap(d, colW - 12, desc, env.measure).length * desc.lineHeight;
                h += 2.2;
            }
            maxH = Math.max(maxH, h + 6);
        }

        return sectionChrome(env.tokens, env.density, env.s) + maxH;
    }

    function measureOwners(block, width, env) {
        const owners = arrayFrom(block);
        if (!owners.length) return 0;
        const name = token(env.tokens, 'ownerName', env.density, 5.3, 6.2, 'medium');
        const itemW = Math.max(80, (width - env.s.padX * 2) / Math.min(6, owners.length));
        const rows = Math.ceil(owners.length / Math.max(1, Math.floor((width-env.s.padX*2)/itemW)));
        return sectionChrome(env.tokens, env.density, env.s) + rows * Math.max(19, name.lineHeight + 10);
    }

    function measureBlock(block, width, env) {
        switch (idOf(block)) {
            case 'header': return 34;
            case 'meetingStats': return 18;
            case 'executiveSummary': return measureSummary(block, width, env);
            case 'keyMetrics': return measureMetrics(block, width, env);
            case 'insights':
            case 'decisions':
            case 'risks': return measureList(block, width, env);
            case 'tasks': return measureTasks(block, width, env);
            case 'architecture': return measureArchitecture(block, width, env);
            case 'owners': return measureOwners(block, width, env);
            case 'footer': return 14;
            default: return 30;
        }
    }

    function clone(block, geometry, meta) {
        return Object.freeze({
            ...block,
            geometry: Object.freeze(geometry),
            layout: Object.freeze(meta || {})
        });
    }

    function mapById(blocks) {
        const map = new Map();
        for (const block of blocks) {
            const id = idOf(block);
            if (id && !map.has(id)) map.set(id, block);
        }
        return map;
    }

    function buildPage(blocks, density, options) {
        const golden = options?.tokens?.goldenReference?.regions || {};
        const goldenH = (name, fallback) => Number(golden?.[name]?.h ?? fallback);
        const tokens = options?.tokens || {};
        const s = spacing(tokens, density);
        const env = { tokens, density, s, measure: makeMeasure(options) };
        const map = mapById(blocks);
        const x = s.marginX;
        const contentW = PAGE.width - s.marginX * 2;
        const out = [];
        let y = s.marginTop;

        function full(id, forcedHeight=null) {
            const b = map.get(id);
            if (!b) return;
            const h = forcedHeight ?? measureBlock(b, contentW, env);
            out.push(clone(b, {x, y, width:contentW, height:h}, {density, naturalHeight:h}));
            y += h + s.sectionGap;
        }

        full('header', goldenH('header', 34));
        full('meetingStats', goldenH('statistics', 18));

        const summary = map.get('executiveSummary');
        const metrics = map.get('keyMetrics');
        if (summary && metrics) {
            const leftW = (contentW - s.columnGap) * 0.435;
            const rightW = contentW - s.columnGap - leftW;
            const hs = measureBlock(summary, leftW, env);
            const hm = measureBlock(metrics, rightW, env);
            const rowH = Math.max(hs, hm);
            out.push(clone(summary, {x,y,width:leftW,height:rowH}, {density,naturalHeight:hs}));
            out.push(clone(metrics, {x:x+leftW+s.columnGap,y,width:rightW,height:rowH}, {density,naturalHeight:hm}));
            y += rowH + s.sectionGap;
        } else {
            if (summary) full('executiveSummary');
            if (metrics) full('keyMetrics');
        }

        const trioIds = ['insights','decisions','risks'].filter(id => map.has(id));
        if (trioIds.length) {
            // Golden width ratio 32 / 36 / 32 when all three exist.
            let widths;
            if (trioIds.length === 3) {
                const available = contentW - s.columnGap * 2;
                widths = [available*0.32, available*0.36, available*0.32];
            } else {
                const w = (contentW - s.columnGap*(trioIds.length-1))/trioIds.length;
                widths = trioIds.map(()=>w);
            }
            const heights = trioIds.map((id,i)=>measureBlock(map.get(id), widths[i], env));
            const rowH = Math.max(...heights);
            let cx = x;
            trioIds.forEach((id,i)=>{
                out.push(clone(map.get(id), {x:cx,y,width:widths[i],height:rowH}, {density,naturalHeight:heights[i]}));
                cx += widths[i] + s.columnGap;
            });
            y += rowH + s.sectionGap;
        }

        const tasks = map.get('tasks');
        const architecture = map.get('architecture');
        if (tasks && architecture) {
            const leftW = (contentW - s.columnGap) * 0.39;
            const rightW = contentW - s.columnGap - leftW;
            const ht = measureBlock(tasks, leftW, env);
            const ha = measureBlock(architecture, rightW, env);
            const rowH = Math.max(ht,ha);
            out.push(clone(tasks,{x,y,width:leftW,height:rowH},{density,naturalHeight:ht}));
            out.push(clone(architecture,{x:x+leftW+s.columnGap,y,width:rightW,height:rowH},{density,naturalHeight:ha}));
            y += rowH + s.sectionGap;
        } else {
            if (tasks) full('tasks');
            if (architecture) full('architecture');
        }

        full('owners');

        const footer = map.get('footer');
        if (footer) {
            const h = 14;
            const bottomY = PAGE.height - s.marginBottom - h;
            const fy = Math.max(y, bottomY);
            out.push(clone(footer,{x,y:fy,width:contentW,height:h},{density,naturalHeight:h}));
            y = fy + h;
        }

        const usedHeight = y + s.marginBottom;
        return {density, blocks:out, usedHeight, fits:usedHeight <= PAGE.height + 0.01};
    }

    function paginate(blocks, density, options) {
        const tokens = options?.tokens || {};
        const s = spacing(tokens,density);
        const env = {tokens,density,s,measure:makeMeasure(options)};
        const contentW = PAGE.width-s.marginX*2;
        const maxBottom = PAGE.height-s.marginBottom;
        const pages=[];
        let current=[], y=s.marginTop;

        function flush(){
            if(!current.length) return;
            pages.push(Object.freeze({
                id:`page-${pages.length+1}`, number:pages.length+1, index:pages.length,
                kind: pages.length ? 'continuation' : 'executive',
                size:PAGE, blocks:Object.freeze(current)
            }));
            current=[]; y=s.marginTop;
        }

        for(const block of blocks){
            const h=measureBlock(block,contentW,env);
            if(current.length && y+h>maxBottom) flush();
            // Never shrink/clamp a block to page height: that would create clipping.
            current.push(clone(block,{x:s.marginX,y,width:contentW,height:h},{density,paginated:true,naturalHeight:h}));
            y+=h+s.sectionGap;
        }
        flush();
        return pages;
    }

    function layout(composition, options={}) {
        const blocks = getBlocks(composition)
            .filter(Boolean)
            .sort((a,b)=>{
                const ai=ORDER.indexOf(idOf(a)), bi=ORDER.indexOf(idOf(b));
                return (ai<0?999:ai)-(bi<0?999:bi);
            });

        if(!blocks.length){
            return Object.freeze({pageCount:0,valid:true,density:'regular',pages:Object.freeze([]),diagnostics:Object.freeze([]),attempts:Object.freeze([])});
        }

        const attempts=[];
        let selected=null;
        for(const density of ['regular','compact','dense']){
            const attempt=buildPage(blocks,density,options);
            attempts.push(Object.freeze({density,usedHeight:attempt.usedHeight,fits:attempt.fits}));
            if(attempt.fits){selected=attempt;break;}
        }

        let pages,density;
        if(selected){
            density=selected.density;
            pages=[Object.freeze({id:'page-1',number:1,index:0,kind:'executive',size:PAGE,blocks:Object.freeze(selected.blocks)})];
        }else{
            density='dense';
            pages=paginate(blocks,density,options);
        }

        const diagnostics=[];
        for(const page of pages){
            for(const block of page.blocks){
                const g=block.geometry;
                if(g.x<0||g.y<0||g.x+g.width>PAGE.width+.1||g.y+g.height>PAGE.height+.1){
                    diagnostics.push(Object.freeze({level:'warning',code:'OUTSIDE_PAGE',blockId:idOf(block),geometry:g}));
                }
            }
        }

        return Object.freeze({
            pageCount:pages.length,
            valid:!diagnostics.some(d=>d.level==='error'),
            density,size:PAGE,
            pages:Object.freeze(pages),
            diagnostics:Object.freeze(diagnostics),
            attempts:Object.freeze(attempts)
        });
    }

    global.MeetMindLayoutEngine=Object.freeze({
        version:'golden-1.1.1-structural-fidelity',
        PAGE,layout
    });
})(window);
