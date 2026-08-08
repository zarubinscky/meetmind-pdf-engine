/**
 * MeetMind Executive PDF Engine
 * Semantic Block Renderers — Golden v1.1
 *
 * Renderer contract:
 *   renderer(block, pageContext)
 *
 * All text is rendered in full. No maxLines, slice(), ellipsis or hidden-count
 * behavior is permitted here. Layout Engine owns physical fit.
 */
(function (global) {
    'use strict';

    const host = global.ExecutiveSlideEngine || (global.ExecutiveSlideEngine = {});
    const TITLES = {
        summary:'Executive Summary', metrics:'Key Metrics',
        insights:'Insights', decisions:'Decisions', risks:'Risks',
        tasks:'Tasks', architecture:'Architecture', owners:'Owners'
    };

    function clean(v){return v===null||v===undefined?'':String(v).replace(/\s+/g,' ').trim();}
    function density(ctx){return ctx.density||'regular';}
    function tokens(ctx){return ctx.tokens||{};}
    function spacing(ctx){
        const t=tokens(ctx).spacing?.[density(ctx)]||{};
        return {
            padX:Number(t.cardPaddingX??t.cardPadding??6),
            padY:Number(t.cardPaddingY??t.cardPadding??5),
            titleGap:Number(t.titleGap??3),
            cardGap:Number(t.cardGap??3),
            bulletGap:Number(t.bulletGap??2.5)
        };
    }
    function style(ctx,name,fallback={font:'regular',size:6,lineHeight:7,color:'textPrimary'}){
        const t=tokens(ctx).typography?.tokens?.[name];
        if(!t)return fallback;
        const d=density(ctx);
        return {
            font:t.font||fallback.font,
            size:Number(t.size?.[d]??t.size?.regular??fallback.size),
            lineHeight:Number(t.lineHeight?.[d]??t.lineHeight?.regular??fallback.lineHeight),
            color:t.color||fallback.color
        };
    }
    function measure(ctx,text,s){return ctx.measureText(clean(text),s.font,s.size);}
    function wrap(ctx,text,width,s){
        const raw=String(text??'').replace(/\r\n?/g,'\n');
        if(!raw.trim())return[];
        const out=[];
        raw.split('\n').forEach(p=>{
            if(!p.trim()){out.push('');return;}
            let line='';
            for(const word of p.trim().split(/\s+/)){
                const candidate=line?`${line} ${word}`:word;
                if(measure(ctx,candidate,s)<=width){line=candidate;continue;}
                if(line){out.push(line);line='';}
                let fragment='';
                for(const ch of Array.from(word)){
                    const next=fragment+ch;
                    if(fragment&&measure(ctx,next,s)>width){out.push(fragment);fragment=ch;}
                    else fragment=next;
                }
                line=fragment;
            }
            if(line)out.push(line);
        });
        return out;
    }
    function textLines(ctx,text,x,y,width,s,align='left'){
        const lines=wrap(ctx,text,width,s);
        lines.forEach((line,i)=>{
            let tx=x;
            const w=measure(ctx,line,s);
            if(align==='center')tx+=Math.max(0,(width-w)/2);
            if(align==='right')tx+=Math.max(0,width-w);
            ctx.text(line,{x:tx,y:y+i*s.lineHeight,size:s.size,font:s.font,color:s.color});
        });
        return lines.length*s.lineHeight;
    }
    function card(ctx,g){
        ctx.rect({x:g.x,y:g.y,width:g.width,height:g.height,fill:'cardBg',stroke:'borderDefault',borderWidth:.5,radius:4});
    }
    function sectionHeader(ctx,g,title,color='purplePrimary'){
        const sp=spacing(ctx), s=style(ctx,'blockTitle',{font:'bold',size:8.2,lineHeight:9.8,color:'textPrimary'});
        // small cross/marker as current icon-system placeholder, deterministic and unobtrusive
        ctx.line({x1:g.x+sp.padX,y1:g.y+sp.padY+4,x2:g.x+sp.padX+7,y2:g.y+sp.padY+4,color,thickness:.7});
        ctx.line({x1:g.x+sp.padX+3.5,y1:g.y+sp.padY+.5,x2:g.x+sp.padX+3.5,y2:g.y+sp.padY+7.5,color,thickness:.7});
        ctx.text(title,{x:g.x+sp.padX+12,y:g.y+sp.padY,size:s.size,font:s.font,color});
        return g.y+sp.padY+s.lineHeight+sp.titleGap;
    }
    function blockData(block){
        return block?.data??block?.content??block?.items??block?.value;
    }
    function arrayData(block){
        const d=blockData(block);
        if(Array.isArray(d))return d;
        if(d&&typeof d==='object'){
            for(const k of ['items','metrics','tasks','sections','owners','values'])if(Array.isArray(d[k]))return d[k];
        }
        return[];
    }
    function reportArray(report,...keys){
        for(const k of keys)if(Array.isArray(report?.[k]))return report[k];
        return[];
    }
    function titleDesc(item){
        if(typeof item==='string')return{title:clean(item),description:''};
        return{
            title:clean(item?.title||item?.label||item?.name||item?.task||''),
            description:clean(item?.description||item?.details||item?.text||'')
        };
    }

    function renderHeader(block,ctx){
        const r=ctx.report||{}, g=block.geometry;
        const title=clean(r.title||r.meeting_title||r.meetingTitle||'Meeting Report');
        const date=clean(
            r.date||r.meeting_date||r.meetingDate||r.created_at||r.createdAt||
            r.metadata?.date||r.meeting?.date||r.meeting?.created_at||''
        );
        const time=clean(r.time||r.meeting_time||r.meetingTime||r.metadata?.time||'');
        const titleS=style(ctx,'reportTitle',{font:'bold',size:15,lineHeight:18.5,color:'textPrimary'});
        const metaS=style(ctx,'meetingMeta',{font:'medium',size:7.5,lineHeight:9,color:'textSecondary'});
        const left=g.x+9;
        textLines(ctx,title,left,g.y+4,g.width-150,titleS);
        const meta=[date,time].filter(Boolean).join('   |   ');
        if(meta)ctx.text(meta,{x:left,y:g.y+25,size:metaS.size,font:metaS.font,color:metaS.color});

        // deterministic lightweight mountain until final asset polish
        const rx=g.x+g.width-108, by=g.y+28;
        ctx.line({x1:rx,y1:by,x2:rx+27,y2:by-18,color:'purpleSoft',thickness:1.4});
        ctx.line({x1:rx+27,y1:by-18,x2:rx+52,y2:by,color:'purpleSoft',thickness:1.4});
        ctx.line({x1:rx+52,y1:by,x2:rx+79,y2:by-25,color:'purplePrimary',thickness:1.6});
        ctx.line({x1:rx+79,y1:by-25,x2:rx+106,y2:by,color:'purplePrimary',thickness:1.6});
    }

    function statEntries(report){
        const explicit=report?.meetingStats||report?.meeting_stats||report?.stats;
        if(explicit&&typeof explicit==='object'&&!Array.isArray(explicit)&&Object.keys(explicit).length){
            const map={participants:'Participants',tasks:'Tasks',decisions:'Decisions',risks:'Risks'};
            return Object.entries(explicit).filter(([,v])=>v!==null&&v!==undefined&&v!=='')
                .slice(0,4).map(([k,v])=>({label:map[k]||k,value:String(v)}));
        }
        return[
            {label:'Participants',value:String(reportArray(report,'participants').length)},
            {label:'Tasks',value:String(reportArray(report,'tasks').length)},
            {label:'Decisions',value:String(reportArray(report,'decisions').length)},
            {label:'Risks',value:String(reportArray(report,'risks').length)}
        ];
    }
    function renderStats(block,ctx){
        const g=block.geometry, entries=statEntries(ctx.report||{});
        const label=style(ctx,'statLabel',{font:'semibold',size:6.4,lineHeight:7.6,color:'textPrimary'});
        const value=style(ctx,'statValue',{font:'bold',size:6.6,lineHeight:7.8,color:'textPrimary'});
        const colors=['purplePrimary','purplePrimary','greenSuccess','orangeRisk'];
        const itemW=Math.min(120,(g.width-12)/Math.max(1,entries.length));
        let x=g.x+9;
        entries.forEach((e,i)=>{
            ctx.circle({x:x+4,y:g.y+8,radius:3,fill:colors[i]||'purplePrimary'});
            ctx.text(e.label,{x:x+11,y:g.y+3,size:label.size,font:label.font,color:label.color});
            const lw=measure(ctx,e.label,label);
            ctx.text(e.value,{x:x+14+lw,y:g.y+3,size:value.size,font:value.font,color:value.color});
            x+=itemW;
        });
    }

    function renderSummary(block,ctx){
        const g=block.geometry; card(ctx,g);
        let y=sectionHeader(ctx,g,TITLES.summary,'purplePrimary');
        const sp=spacing(ctx), s=style(ctx,'body',{font:'regular',size:6.3,lineHeight:7.8,color:'textPrimary'});
        const r=ctx.report||{};
        const value=clean(r.summary||r.executive_summary||r.executiveSummary||r.meeting_summary||blockData(block)||'—');
        textLines(ctx,value,g.x+sp.padX,y,g.width-sp.padX*2,s);
    }

    function metricsFrom(block,report){
        const b=arrayData(block); if(b.length)return b;
        return reportArray(report,'metrics','key_metrics','keyMetrics');
    }
    function renderMetrics(block,ctx){
        const g=block.geometry; card(ctx,g);
        const sp=spacing(ctx); let y=sectionHeader(ctx,g,TITLES.metrics,'purplePrimary');
        const metrics=metricsFrom(block,ctx.report||{});
        const cols=Math.min(4,Math.max(1,metrics.length));
        const rows=Math.ceil(metrics.length/cols);
        const gap=sp.cardGap;
        const innerX=g.x+sp.padX, innerW=g.width-sp.padX*2, innerBottom=g.y+g.height-sp.padY;
        const cellW=(innerW-gap*(cols-1))/cols;
        const cellH=(innerBottom-y-gap*Math.max(0,rows-1))/Math.max(1,rows);
        const ls=style(ctx,'metricLabel',{font:'semibold',size:5.2,lineHeight:6.2,color:'textSecondary'});
        const vs=style(ctx,'metricValue',{font:'bold',size:8.5,lineHeight:9.5,color:'textPrimary'});

        metrics.forEach((m,i)=>{
            const col=i%cols,row=Math.floor(i/cols);
            const x=innerX+col*(cellW+gap), cy=y+row*(cellH+gap);
            ctx.rect({x,y:cy,width:cellW,height:cellH,fill:'cardBg',stroke:'borderDefault',borderWidth:.5,radius:3});
            ctx.circle({x:x+8,y:cy+9,radius:2.1,fill:'purpleSoft',stroke:'purplePrimary',borderWidth:.5});
            const label=clean(m?.label||m?.title||m?.name||'');
            const value=clean(m?.value||m?.metric||m?.amount||'—');
            const labelY=cy+6;
            const labelHeight=textLines(ctx,label,x+13,labelY,cellW-18,ls);
            const valueY=Math.max(cy+22,labelY+labelHeight+3);
            textLines(ctx,value,x+6,valueY,cellW-12,vs,'center');
        });
    }

    function listItems(block,report,key){
        const b=arrayData(block); if(b.length)return b;
        return reportArray(report,key);
    }
    function renderList(block,ctx,key,title,color){
        const g=block.geometry; card(ctx,g);
        const sp=spacing(ctx); let y=sectionHeader(ctx,g,title,color);
        const strong=style(ctx,'listStrong',{font:'semibold',size:6.1,lineHeight:7.4,color:'textPrimary'});
        const body=style(ctx,'listBody',{font:'regular',size:6.1,lineHeight:7.4,color:'textPrimary'});
        const badge=style(ctx,'badgeNumber',{font:'bold',size:5,lineHeight:5.4,color:'white'});
        const items=listItems(block,ctx.report||{},key);
        items.forEach((raw,i)=>{
            const item=titleDesc(raw);
            const bx=g.x+sp.padX+4;
            ctx.circle({x:bx,y:y+4,radius:3.2,fill:color});
            const n=String(i+1), nw=measure(ctx,n,badge);
            ctx.text(n,{x:bx-nw/2,y:y+1.2,size:badge.size,font:badge.font,color:'white'});
            const tx=g.x+sp.padX+13, tw=g.width-sp.padX*2-13;
            y+=textLines(ctx,item.title,tx,y,tw,strong);
            if(item.description)y+=textLines(ctx,item.description,tx,y,tw,body);
            y+=sp.bulletGap;
        });
    }
    function renderInsights(b,c){renderList(b,c,'insights',TITLES.insights,'purplePrimary');}
    function renderDecisions(b,c){renderList(b,c,'decisions',TITLES.decisions,'greenSuccess');}
    function renderRisks(b,c){renderList(b,c,'risks',TITLES.risks,'orangeRisk');}

    function tasksFrom(block,report){const b=arrayData(block);return b.length?b:reportArray(report,'tasks');}
    function renderTasks(block,ctx){
        const g=block.geometry; card(ctx,g);
        const sp=spacing(ctx); let y=sectionHeader(ctx,g,TITLES.tasks,'purplePrimary');
        const tasks=tasksFrom(block,ctx.report||{});
        const hs=style(ctx,'taskHeader',{font:'semibold',size:4.8,lineHeight:5.6,color:'textSecondary'});
        const cs=style(ctx,'taskCell',{font:'regular',size:4.8,lineHeight:5.8,color:'textPrimary'});
        const innerX=g.x+sp.padX, innerW=g.width-sp.padX*2;
        const noW=14, ownerW=innerW*.20, dueW=Math.max(31,innerW*.17), taskW=innerW-noW-ownerW-dueW;
        const xs=[innerX,innerX+noW,innerX+noW+taskW,innerX+noW+taskW+ownerW];
        ['#','Task','Owner','Due Date'].forEach((h,i)=>ctx.text(h,{x:xs[i]+2,y,size:hs.size,font:hs.font,color:hs.color}));
        y+=hs.lineHeight+4;
        ctx.line({x1:innerX,y1:y-1,x2:innerX+innerW,y2:y-1,color:'dividerDefault',thickness:.35});

        tasks.forEach((t,i)=>{
            const task=clean(t?.task||t?.title||t?.description||t?.text);
            const owner=clean(t?.owner?.name||t?.owner||'');
            const due=clean(t?.due_date||t?.dueDate||t?.deadline||'');
            const taskLines=wrap(ctx,task,taskW-5,cs);
            const ownerLines=wrap(ctx,owner,ownerW-5,cs);
            const dueLines=wrap(ctx,due,dueW-5,cs);
            const lines=Math.max(1,taskLines.length,ownerLines.length,dueLines.length);
            const rowH=Math.max(9,lines*cs.lineHeight+3);
            ctx.text(String(i+1),{x:xs[0]+2,y:y+2,size:cs.size,font:cs.font,color:cs.color});
            taskLines.forEach((l,j)=>ctx.text(l,{x:xs[1]+2,y:y+2+j*cs.lineHeight,size:cs.size,font:cs.font,color:cs.color}));
            ownerLines.forEach((l,j)=>ctx.text(l,{x:xs[2]+2,y:y+2+j*cs.lineHeight,size:cs.size,font:cs.font,color:cs.color}));
            if(due){
                const pillW=Math.min(dueW-4,measure(ctx,due,cs)+8);
                ctx.rect({x:xs[3]+2,y:y+1,width:pillW,height:cs.lineHeight+3,fill:'purpleSoft',stroke:'purpleSoft',borderWidth:0,radius:3});
                dueLines.slice(0,1).forEach(l=>ctx.text(l,{x:xs[3]+6,y:y+2,size:cs.size,font:'medium',color:'purplePrimary'}));
            }
            y+=rowH;
            ctx.line({x1:innerX,y1:y,x2:innerX+innerW,y2:y,color:'dividerDefault',thickness:.25});
        });
    }

    function architectureFrom(block,report){
        const d=blockData(block);
        if(Array.isArray(d))return d;
        if(Array.isArray(d?.sections))return d.sections;
        if(Array.isArray(report?.architecture?.sections))return report.architecture.sections;
        if(Array.isArray(report?.architecture))return report.architecture;
        return[];
    }
    function renderArchitecture(block,ctx){
        const g=block.geometry; card(ctx,g);
        const sp=spacing(ctx); let y=sectionHeader(ctx,g,TITLES.architecture,'purplePrimary');
        const sections=architectureFrom(block,ctx.report||{});
        const cols=Math.min(4,Math.max(1,sections.length)), gap=sp.cardGap;
        const innerX=g.x+sp.padX, innerW=g.width-sp.padX*2, colW=(innerW-gap*(cols-1))/cols;
        const secNo=style(ctx,'architectureSectionNo',{font:'bold',size:6.8,lineHeight:8,color:'textPrimary'});
        const secTitle=style(ctx,'architectureSectionTitle',{font:'bold',size:5.9,lineHeight:6.9,color:'textPrimary'});
        const itemTitle=style(ctx,'architectureItemTitle',{font:'semibold',size:5,lineHeight:5.8,color:'textPrimary'});
        const desc=style(ctx,'architectureDescription',{font:'regular',size:4.7,lineHeight:5.6,color:'textSecondary'});
        const accents=['purplePrimary','greenSuccess','orangeRisk','purplePrimary'];

        sections.forEach((sec,i)=>{
            const x=innerX+i*(colW+gap);
            ctx.rect({x,y,width:colW,height:g.y+g.height-sp.padY-y,fill:'cardBg',stroke:'borderDefault',borderWidth:.5,radius:3});
            ctx.text(String(i+1),{x:x+6,y:y+6,size:secNo.size,font:secNo.font,color:accents[i]});
            let sy=y+6;
            sy+=textLines(ctx,clean(sec?.title||sec?.name),x+17,sy,colW-22,secTitle);
            sy+=4;
            (Array.isArray(sec?.items)?sec.items:[]).forEach(item=>{
                ctx.circle({x:x+7,y:sy+3,radius:1.5,fill:accents[i]});
                const t=clean(item?.title||item?.name||item?.label);
                const d=clean(item?.description||item?.text||'');
                sy+=textLines(ctx,t,x+12,sy,colW-17,itemTitle);
                if(d)sy+=textLines(ctx,d,x+12,sy,colW-17,desc);
                sy+=2;
            });
            if(i<sections.length-1){
                ctx.text('›',{x:x+colW+gap/2-1.5,y:y+8,size:6,font:'bold',color:'textMuted'});
            }
        });
    }

    function ownersFrom(block,report){const b=arrayData(block);return b.length?b:reportArray(report,'owners');}
    function initials(name){return clean(name).split(/\s+/).slice(0,2).map(p=>p[0]||'').join('').toUpperCase();}
    function renderOwners(block,ctx){
        const g=block.geometry; const sp=spacing(ctx);
        const title=style(ctx,'blockTitle',{font:'bold',size:8.2,lineHeight:9.8,color:'textPrimary'});
        ctx.text(TITLES.owners,{x:g.x+sp.padX,y:g.y+sp.padY,size:title.size,font:title.font,color:'purplePrimary'});
        const owners=ownersFrom(block,ctx.report||{});
        const name=style(ctx,'ownerName',{font:'medium',size:5.3,lineHeight:6.2,color:'textPrimary'});
        const init=style(ctx,'ownerInitials',{font:'bold',size:5.2,lineHeight:6,color:'purplePrimary'});
        const startX=g.x+70, available=g.width-78, itemW=available/Math.max(1,owners.length);
        owners.forEach((o,i)=>{
            const n=clean(o?.name||o), x=startX+i*itemW;
            ctx.circle({x:x+8,y:g.y+g.height/2,radius:7.2,fill:'purpleSoft'});
            const ins=initials(n), iw=measure(ctx,ins,init);
            ctx.text(ins,{x:x+8-iw/2,y:g.y+g.height/2-3,size:init.size,font:init.font,color:init.color});
            ctx.text(n,{x:x+19,y:g.y+g.height/2-3,size:name.size,font:name.font,color:name.color});
        });
    }
    function renderFooter(block,ctx){
        const g=block.geometry;
        const fs=style(ctx,'footer',{font:'regular',size:5.8,lineHeight:6.8,color:'textSecondary'});
        const bs=style(ctx,'brandLink',{font:'semibold',size:5.9,lineHeight:6.8,color:'purplePrimary'});
        const brand='meetmind.ai', generated='Generated by MeetMind AI';
        const bw=measure(ctx,brand,bs), gw=measure(ctx,generated,fs);
        const right=g.x+g.width;
        ctx.text(brand,{x:right-bw,y:g.y+3,size:bs.size,font:bs.font,color:bs.color});
        ctx.line({x1:right-bw-10,y1:g.y+1,x2:right-bw-10,y2:g.y+10,color:'dividerDefault',thickness:.4});
        ctx.text(generated,{x:right-bw-18-gw,y:g.y+3,size:fs.size,font:fs.font,color:fs.color});
    }

    host.blockRenderers=Object.freeze({
        version:'1.1.0-golden',
        header:renderHeader,
        stats:renderStats,
        meetingStats:renderStats,
        summary:renderSummary,
        executiveSummary:renderSummary,
        metrics:renderMetrics,
        keyMetrics:renderMetrics,
        insights:renderInsights,
        decisions:renderDecisions,
        risks:renderRisks,
        tasks:renderTasks,
        architecture:renderArchitecture,
        owners:renderOwners,
        footer:renderFooter
    });
})(window);
