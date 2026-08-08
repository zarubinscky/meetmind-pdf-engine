/*
 * MeetMind AI — Executive PDF Engine
 * Golden Semantic Block Renderers v1.0
 *
 * The renderers consume immutable geometry from Layout Engine and visual
 * tokens from Golden Design System. They never paginate, truncate, ellipsize,
 * hide content, or change business semantics.
 */
(function initializeGoldenBlockRenderers(globalScope) {
    'use strict';

    const engine = globalScope.ExecutiveSlideEngine || {};
    const VERSION = '1.0.0-golden';

    const TITLES = Object.freeze({
        summary: 'Executive Summary', metrics: 'Key Metrics', insights: 'Insights',
        decisions: 'Decisions', risks: 'Risks', tasks: 'Tasks',
        architecture: 'Architecture', owners: 'Owners'
    });

    const ACCENT = Object.freeze({
        summary: 'purplePrimary', metrics: 'purplePrimary', insights: 'purplePrimary',
        decisions: 'greenSuccess', risks: 'orangeRisk', tasks: 'purplePrimary',
        architecture: 'purplePrimary', owners: 'purplePrimary'
    });

    function state(block, ctx) {
        const design = engine.design;
        if (!design) throw new Error('Golden block renderers require ExecutiveSlideEngine.design.');
        const density = normalizeDensity(block.density || ctx.density);
        return {
            block, ctx, density, tokens: design.TOKENS,
            spacing: design.getDensityTokens(density),
            type(name) { return design.getTypographyToken(name, density); },
            color(name) { return design.getColor(name); }
        };
    }

    function normalizeDensity(value) { return value === 'dense' || value === 'compact' ? value : 'regular'; }
    function data(block) { return block && block.data != null ? block.data : {}; }
    function asArray(value) { return Array.isArray(value) ? value : []; }
    function text(value) { return value == null ? '' : String(value).trim(); }
    function first(...values) { for (const v of values) { const t = text(v); if (t) return t; } return ''; }

    function card(s, geometry, opts = {}) {
        s.ctx.rect({
            x: geometry.x, y: geometry.y, width: geometry.width, height: geometry.height,
            fill: s.color(opts.fill || 'cardBg'),
            stroke: s.color(opts.stroke || 'borderDefault'),
            borderWidth: opts.borderWidth ?? s.tokens.borders.card.width,
            radius: opts.radius ?? s.tokens.shapes.sectionRadius[s.density]
        });
    }

    function sectionHeader(s, title, accentName = 'purplePrimary', geometry = s.block.geometry) {
        const style = s.type('blockTitle');
        const x = geometry.x + s.spacing.cardPadX;
        const y = geometry.y + s.spacing.cardPadY;
        const icon = s.tokens.icons.section[s.density];
        drawSectionGlyph(s, x + icon / 2, y + icon / 2, icon, accentName, s.block.id);
        s.ctx.text(title, { x: x + icon + 4, y: y - 0.2, size: style.size, font: style.font, color: s.color(accentName) });
        return y + Math.max(icon, style.lineHeight) + s.spacing.titleContentGap;
    }

    function drawSectionGlyph(s, cx, cy, size, accentName, kind) {
        const c = s.color(accentName);
        const r = Math.max(1.4, size * 0.18);
        if (kind === 'risks') {
            s.ctx.line({ start:{x:cx, y:cy-size*.34}, end:{x:cx-size*.34,y:cy+size*.30}, thickness:1, color:c });
            s.ctx.line({ start:{x:cx-size*.34,y:cy+size*.30}, end:{x:cx+size*.34,y:cy+size*.30}, thickness:1, color:c });
            s.ctx.line({ start:{x:cx+size*.34,y:cy+size*.30}, end:{x:cx,y:cy-size*.34}, thickness:1, color:c });
            return;
        }
        if (kind === 'decisions') {
            s.ctx.circle({ x:cx, y:cy, radius:size*.35, stroke:c, borderWidth:1 });
            s.ctx.line({ start:{x:cx-size*.17,y:cy}, end:{x:cx-size*.03,y:cy+size*.14}, thickness:1, color:c });
            s.ctx.line({ start:{x:cx-size*.03,y:cy+size*.14}, end:{x:cx+size*.22,y:cy-size*.15}, thickness:1, color:c });
            return;
        }
        s.ctx.circle({ x:cx, y:cy, radius:r, fill:c, borderWidth:0 });
        s.ctx.line({ start:{x:cx-r*2.1,y:cy}, end:{x:cx+r*2.1,y:cy}, thickness:.7, color:c });
        s.ctx.line({ start:{x:cx,y:cy-r*2.1}, end:{x:cx,y:cy+r*2.1}, thickness:.7, color:c });
    }

    function wrap(s, value, fontName, size, maxWidth) {
        const src = text(value);
        if (!src) return [];
        const paragraphs = src.split(/\n+/);
        const output = [];
        paragraphs.forEach((paragraph, pi) => {
            const words = paragraph.split(/\s+/).filter(Boolean);
            let line = '';
            for (const word of words) {
                const candidate = line ? line + ' ' + word : word;
                if (s.ctx.measureText(candidate, fontName, size) <= maxWidth || !line) {
                    if (s.ctx.measureText(candidate, fontName, size) <= maxWidth) {
                        line = candidate;
                    } else {
                        let fragment = '';
                        for (const ch of word) {
                            const next = fragment + ch;
                            if (!fragment || s.ctx.measureText(next, fontName, size) <= maxWidth) fragment = next;
                            else { output.push(fragment); fragment = ch; }
                        }
                        line = fragment;
                    }
                } else {
                    output.push(line);
                    line = word;
                }
            }
            if (line) output.push(line);
            if (pi < paragraphs.length - 1) output.push('');
        });
        return output;
    }

    function drawLines(s, lines, opts) {
        let y = opts.y;
        const style = opts.style;
        for (const line of lines) {
            if (line) s.ctx.text(line, { x: opts.x, y, size: style.size, font: style.font, color: opts.color || s.color(style.color) });
            y += style.lineHeight;
        }
        return y;
    }

    function drawWrappedText(s, value, opts) {
        const style = opts.style;
        const lines = wrap(s, value, style.font, style.size, opts.width);
        return drawLines(s, lines, { ...opts, lines, style });
    }

    function normalizeList(value) {
        if (Array.isArray(value)) return value.map(item => typeof item === 'string' ? { title:item, details:'' } : {
            title: first(item?.title, item?.name, item?.label, item?.task, item?.decision, item?.risk),
            details: first(item?.details, item?.description, item?.text, item?.value)
        });
        return [];
    }

    function renderHeader(block, ctx) {
        const s = state(block, ctx); const d = data(block); const g = block.geometry;
        const titleStyle = s.type('reportTitle'); const metaStyle = s.type('meetingMeta');
        const title = first(d.title, ctx.report?.title, 'Meeting Report');
        const date = first(d.date, ctx.report?.date, ctx.report?.created_at);
        drawSectionGlyph(s, g.x + 9, g.y + 10, 13, 'purplePrimary', 'header');
        drawWrappedText(s, title, { x:g.x+18, y:g.y+1, width:Math.max(40,g.width-165), style:titleStyle });
        if (date) s.ctx.text(date, { x:g.x+18, y:g.y+27, size:metaStyle.size, font:metaStyle.font, color:s.color(metaStyle.color) });
        // Golden decorative mountain: vector silhouette, intentionally decorative only.
        const mx = g.x + g.width - 110, my = g.y + 3;
        const purple = s.color('purplePrimary'), soft = s.color('purpleSoft');
        s.ctx.line({start:{x:mx,y:my+38},end:{x:mx+28,y:my+13},thickness:2,color:soft});
        s.ctx.line({start:{x:mx+28,y:my+13},end:{x:mx+52,y:my+31},thickness:2,color:soft});
        s.ctx.line({start:{x:mx+52,y:my+31},end:{x:mx+79,y:my+7},thickness:2,color:purple});
        s.ctx.line({start:{x:mx+79,y:my+7},end:{x:mx+106,y:my+38},thickness:2,color:purple});
    }

    function renderStats(block, ctx) {
        const s = state(block, ctx); const d = data(block); const g = block.geometry;
        const label = s.type('statLabel'), value = s.type('statValue');
        let entries = [];
        if (Array.isArray(d)) entries = d;
        else if (d && typeof d === 'object') {
            const aliases = [
                ['Participants', d.participants ?? d.participantCount ?? ctx.report?.participants?.length],
                ['Tasks', d.tasks ?? d.taskCount ?? ctx.report?.tasks?.length],
                ['Decisions', d.decisions ?? d.decisionCount ?? ctx.report?.decisions?.length],
                ['Risks', d.risks ?? d.riskCount ?? ctx.report?.risks?.length]
            ];
            entries = aliases.filter(e => e[1] !== undefined && e[1] !== null && e[1] !== '');
        }
        let x = g.x + 8; const cy = g.y + g.height/2;
        entries.forEach((entry, i) => {
            const name = first(entry.label, entry.name, entry[0]); const val = entry.value ?? entry.count ?? entry[1] ?? '';
            s.ctx.circle({x:x+4,y:cy,radius:2.7,stroke:s.color('purplePrimary'),borderWidth:.8});
            x += 10;
            s.ctx.text(name, {x,y:g.y+3,size:label.size,font:label.font,color:s.color(label.color)});
            x += s.ctx.measureText(name,label.font,label.size)+5;
            s.ctx.text(String(val), {x,y:g.y+2.7,size:value.size,font:value.font,color:s.color(value.color)});
            x += s.ctx.measureText(String(val),value.font,value.size)+12;
            if (i < entries.length-1) { s.ctx.line({start:{x,y:g.y+2},end:{x,y:g.y+g.height-2},thickness:.35,color:s.color('dividerDefault')}); x += 10; }
        });
    }

    function renderSummary(block, ctx) {
        const s=state(block,ctx), g=block.geometry, d=data(block); card(s,g); const y=sectionHeader(s,TITLES.summary,ACCENT.summary,g);
        const style=s.type('body'); const value=typeof d==='string'?d:first(d.summary,d.text,d.value,d.description);
        drawWrappedText(s,value,{x:g.x+s.spacing.cardPadX,y,width:g.width-s.spacing.cardPadX*2,style});
    }

    function normalizeMetrics(d) {
        const source = Array.isArray(d) ? d : asArray(d.metrics || d.items);
        return source.map(m => typeof m==='string'?{label:m,value:''}:{label:first(m.label,m.title,m.name),value:first(m.value,m.metric,m.amount)});
    }

    function renderMetrics(block, ctx) {
        const s=state(block,ctx),g=block.geometry,d=data(block); card(s,g); const top=sectionHeader(s,TITLES.metrics,ACCENT.metrics,g);
        const metrics=normalizeMetrics(d); if(!metrics.length) return;
        const innerX=g.x+s.spacing.cardPadX, innerW=g.width-s.spacing.cardPadX*2;
        const primaryCount=Math.min(metrics.length,8); const sideCount=Math.max(0,metrics.length-primaryCount);
        const sideW=sideCount?Math.min(92,innerW*.23):0; const sideGap=sideCount?4:0; const primaryW=innerW-sideW-sideGap;
        const cols=Math.min(4,Math.max(1,primaryCount)); const rows=Math.ceil(primaryCount/cols);
        const gapX=3,gapY=3.5; const cardW=(primaryW-gapX*(cols-1))/cols; const availableH=Math.max(20,g.y+g.height-s.spacing.cardPadY-top); const cardH=(availableH-gapY*(rows-1))/Math.max(rows,1);
        const label=s.type('metricLabel'), val=s.type('metricValue');
        metrics.slice(0,primaryCount).forEach((m,i)=>{
            const row=Math.floor(i/cols),col=i%cols,x=innerX+col*(cardW+gapX),y=top+row*(cardH+gapY);
            s.ctx.rect({x,y,width:cardW,height:cardH,fill:s.color('cardBg'),stroke:s.color('borderDefault'),borderWidth:.5,radius:s.tokens.shapes.metricRadius[s.density]});
            s.ctx.circle({x:x+8,y:y+9,radius:2.2,fill:s.color('purpleSoft'),stroke:s.color('purplePrimary'),borderWidth:.5});
            drawWrappedText(s,m.label,{x:x+5,y:y+17,width:cardW-10,style:label});
            s.ctx.text(m.value,{x:x+5,y:y+cardH-val.lineHeight-5,size:val.size,font:val.font,color:s.color(val.color)});
        });
        if(sideCount){
            const sx=innerX+primaryW+sideGap; const sideStyle=s.type('metricSideLabel'),sideVal=s.type('metricSideValue'); const h=(availableH-3.5*(sideCount-1))/sideCount;
            metrics.slice(primaryCount).forEach((m,j)=>{const y=top+j*(h+3.5);s.ctx.rect({x:sx,y,width:sideW,height:h,fill:s.color('mutedSurface'),stroke:s.color('borderDefault'),borderWidth:.5,radius:3});s.ctx.text(m.label,{x:sx+4,y:y+4,size:sideStyle.size,font:sideStyle.font,color:s.color(sideStyle.color)});const vw=s.ctx.measureText(m.value,sideVal.font,sideVal.size);s.ctx.text(m.value,{x:sx+sideW-vw-4,y:y+4,size:sideVal.size,font:sideVal.font,color:s.color(sideVal.color)});});
        }
    }

    function renderListBlock(block,ctx,title,accent){
        const s=state(block,ctx),g=block.geometry,d=data(block);card(s,g);let y=sectionHeader(s,title,accent,g);const items=normalizeList(Array.isArray(d)?d:(d.items||d[block.id]||[]));
        const strong=s.type('listStrong'),body=s.type('listBody');const contentX=g.x+s.spacing.cardPadX;
        items.forEach((item,i)=>{const diameter=s.tokens.badges.diameter[s.density];const cy=y+diameter/2;s.ctx.circle({x:contentX+diameter/2,y:cy,radius:diameter/2,fill:s.color(accent),borderWidth:0});const n=String(i+1);const nw=s.ctx.measureText(n,'bold',s.type('badgeNumber').size);const ns=s.type('badgeNumber');s.ctx.text(n,{x:contentX+diameter/2-nw/2,y:y+.4,size:ns.size,font:ns.font,color:s.color('white')});const tx=contentX+diameter+6,tw=g.x+g.width-s.spacing.cardPadX-tx;let ty=y;if(item.title){ty=drawWrappedText(s,item.title,{x:tx,y:ty,width:tw,style:strong});}if(item.details){ty=drawWrappedText(s,item.details,{x:tx,y:ty,width:tw,style:body});}y=Math.max(ty,y+diameter)+s.spacing.listItemGap;});
    }

    function renderInsights(b,c){renderListBlock(b,c,TITLES.insights,ACCENT.insights)}
    function renderDecisions(b,c){renderListBlock(b,c,TITLES.decisions,ACCENT.decisions)}
    function renderRisks(b,c){renderListBlock(b,c,TITLES.risks,ACCENT.risks)}

    function normalizeTasks(d){const src=Array.isArray(d)?d:asArray(d.tasks||d.items);return src.map(t=>typeof t==='string'?{task:t,owner:'',due:''}:{task:first(t.task,t.title,t.description),owner:first(t.owner,t.assignee),due:first(t.due_date,t.dueDate,t.deadline,t.due)});}
    function renderTasks(block,ctx){
        const s=state(block,ctx),g=block.geometry,d=data(block);card(s,g);let y=sectionHeader(s,TITLES.tasks,ACCENT.tasks,g);const rows=normalizeTasks(d);const header=s.type('taskHeader'),body=s.type('taskCell'),strong=s.type('taskCellStrong');
        const x0=g.x+s.spacing.cardPadX, total=g.width-s.spacing.cardPadX*2;const spec=[['#',.05],['Task',.65],['Owner',.195],['Due Date',.105]];let x=x0;
        s.ctx.rect({x:x0,y,width:total,height:10,fill:s.color('mutedSurface'),stroke:s.color('borderDefault'),borderWidth:.35,radius:0});
        spec.forEach(([name,r])=>{const w=total*r;s.ctx.text(name,{x:x+2,y:y+2,size:header.size,font:header.font,color:s.color(header.color)});x+=w;});y+=10;
        rows.forEach((row,i)=>{const widths=spec.map(sx=>total*sx[1]);const taskLines=wrap(s,row.task,body.font,body.size,widths[1]-6);const ownerLines=wrap(s,row.owner,strong.font,strong.size,widths[2]-6);const dueLines=wrap(s,row.due,body.font,body.size,widths[3]-6);const lineCount=Math.max(1,taskLines.length,ownerLines.length,dueLines.length);const h=Math.max(9,lineCount*body.lineHeight+s.spacing.tableRowPadY*2);s.ctx.line({start:{x:x0,y:y+h},end:{x:x0+total,y:y+h},thickness:.35,color:s.color('borderDefault')});let cx=x0;s.ctx.text(String(i+1),{x:cx+3,y:y+s.spacing.tableRowPadY,size:body.size,font:body.font,color:s.color(body.color)});cx+=widths[0];drawLines(s,taskLines,{x:cx+3,y:y+s.spacing.tableRowPadY,style:body});cx+=widths[1];drawLines(s,ownerLines,{x:cx+3,y:y+s.spacing.tableRowPadY,style:strong});cx+=widths[2];if(row.due){const pillW=Math.min(widths[3]-4,s.ctx.measureText(row.due,body.font,body.size)+6);s.ctx.rect({x:cx+2,y:y+Math.max(1,(h-8)/2),width:pillW,height:8,fill:s.color('purpleSoft'),stroke:s.color('purpleSoft'),borderWidth:0,radius:3});s.ctx.text(row.due,{x:cx+5,y:y+Math.max(1,(h-8)/2)+1.2,size:body.size,font:body.font,color:s.color('purplePrimary')});}y+=h;});
    }

    function architectureSections(d){if(Array.isArray(d))return d; if(Array.isArray(d.sections))return d.sections; return [];}
    function renderArchitecture(block,ctx){
        const s=state(block,ctx),g=block.geometry,d=data(block);card(s,g);let top=sectionHeader(s,TITLES.architecture,ACCENT.architecture,g);const sections=architectureSections(d);if(!sections.length)return;const pad=s.spacing.architecturePad,innerX=g.x+pad,innerW=g.width-pad*2,gap=s.tokens.architecture.sectionGap,sw=(innerW-gap*(sections.length-1))/sections.length;const no=s.type('architectureSectionNo'),st=s.type('architectureSectionTitle'),it=s.type('architectureItemTitle'),desc=s.type('architectureDescription');
        sections.forEach((sec,i)=>{const x=innerX+i*(sw+gap),accent=s.tokens.architecture.accentSequence[i%s.tokens.architecture.accentSequence.length];s.ctx.rect({x,y:top,width:sw,height:Math.max(10,g.y+g.height-pad-top),fill:s.color('cardBg'),stroke:s.color('borderDefault'),borderWidth:.5,radius:3});s.ctx.text(String(i+1),{x:x+5,y:top+4,size:no.size,font:no.font,color:s.color(accent)});drawWrappedText(s,first(sec.title,sec.name,`Section ${i+1}`),{x:x+15,y:top+4,width:sw-20,style:st,color:s.color(accent)});let y=top+st.lineHeight+9;asArray(sec.items).forEach(item=>{const label=typeof item==='string'?item:first(item.title,item.name,item.label);const details=typeof item==='string'?'':first(item.description,item.details,item.text);s.ctx.circle({x:x+7,y:y+3,radius:1.7,fill:s.color(accent),borderWidth:0});let yy=drawWrappedText(s,label,{x:x+12,y,width:sw-17,style:it});if(details)yy=drawWrappedText(s,details,{x:x+12,y:yy,width:sw-17,style:desc});y=yy+s.spacing.architectureItemGap;});if(i<sections.length-1){const ax=x+sw+1.2,ay=top+12;s.ctx.line({start:{x:ax,y:ay},end:{x:ax+gap-2.4,y:ay},thickness:.6,color:s.tokens.architecture.connectorColor});s.ctx.line({start:{x:ax+gap-2.4,y:ay},end:{x:ax+gap-4.2,y:ay-1.5},thickness:.6,color:s.tokens.architecture.connectorColor});s.ctx.line({start:{x:ax+gap-2.4,y:ay},end:{x:ax+gap-4.2,y:ay+1.5},thickness:.6,color:s.tokens.architecture.connectorColor});}});
    }

    function normalizeOwners(d){const src=Array.isArray(d)?d:asArray(d.owners||d.items);return src.map(o=>typeof o==='string'?{name:o,role:''}:{name:first(o.name,o.owner,o.title),role:first(o.role,o.position)});}
    function initials(name){return text(name).split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]?.toUpperCase()||'').join('');}
    function renderOwners(block,ctx){const s=state(block,ctx),g=block.geometry,d=data(block);const owners=normalizeOwners(d);const title=s.type('blockTitle'),name=s.type('ownerName'),role=s.type('ownerRole'),init=s.type('ownerInitials');const x0=g.x+8;drawSectionGlyph(s,x0+5,g.y+8,10,'purplePrimary','owners');s.ctx.text('Owners',{x:x0+14,y:g.y+2,size:title.size,font:title.font,color:s.color('purplePrimary')});let x=x0+62;owners.forEach((o,i)=>{const cy=g.y+11,r=s.tokens.owners.avatarDiameter/2;s.ctx.circle({x:x+r,y:cy,radius:r,fill:s.color('purpleSoft'),borderWidth:0});const ii=initials(o.name),iw=s.ctx.measureText(ii,init.font,init.size);s.ctx.text(ii,{x:x+r-iw/2,y:cy-init.size/2-.4,size:init.size,font:init.font,color:s.color('purplePrimary')});const tx=x+s.tokens.owners.avatarDiameter+4;s.ctx.text(o.name,{x:tx,y:g.y+4,size:name.size,font:name.font,color:s.color(name.color)});if(o.role)s.ctx.text(o.role,{x:tx,y:g.y+12,size:role.size,font:role.font,color:s.color(role.color)});const w=Math.max(44,s.ctx.measureText(o.name,name.font,name.size)+s.tokens.owners.avatarDiameter+10);x+=w;if(i<owners.length-1){s.ctx.line({start:{x:x,y:g.y+3},end:{x:x,y:g.y+19},thickness:.35,color:s.color('dividerDefault')});x+=8;}});}

    function renderFooter(block,ctx){const s=state(block,ctx),g=block.geometry,d=data(block);const ft=s.type('footer'),brand=s.type('brandLink');const label=first(d.text,'Generated by MeetMind AI');const link='meetmind.ai';const lw=s.ctx.measureText(label,ft.font,ft.size),bw=s.ctx.measureText(link,brand.font,brand.size);const x=g.x+g.width-lw-bw-24;s.ctx.text(label,{x,y:g.y+7,size:ft.size,font:ft.font,color:s.color(ft.color)});const divX=x+lw+8;s.ctx.line({start:{x:divX,y:g.y+3},end:{x:divX,y:g.y+18},thickness:.35,color:s.color('dividerDefault')});s.ctx.text(link,{x:divX+9,y:g.y+7,size:brand.size,font:brand.font,color:s.color(brand.color)});s.ctx.line({start:{x:divX+9,y:g.y+7+brand.size+1},end:{x:divX+9+bw,y:g.y+7+brand.size+1},thickness:.4,color:s.color('purplePrimary')});}

    const api=Object.freeze({version:VERSION,header:renderHeader,stats:renderStats,summary:renderSummary,metrics:renderMetrics,insights:renderInsights,decisions:renderDecisions,risks:renderRisks,tasks:renderTasks,architecture:renderArchitecture,owners:renderOwners,footer:renderFooter});
    engine.blockRenderers=api;globalScope.ExecutiveSlideEngine=engine;
    if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
