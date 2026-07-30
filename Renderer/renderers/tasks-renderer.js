/**
 * MeetMind Executive PDF Engine
 * Tasks Renderer
 *
 * Status: READY FOR GITHUB
 */

'use strict';

const {
  drawCard,
  drawSectionTitle,
  getContentRect
} = require('./card-renderer');

module.exports = function renderTasks(block, ctx) {

  const geometry = block.geometry;
  const data = block.data ?? {};
  const tokens = ctx.tokens ?? {};

  drawCard(ctx, geometry);
  drawSectionTitle(ctx, geometry, data.title ?? 'Tasks');

  const body = getContentRect(ctx, geometry);

  const tasks = Array.isArray(data.tasks)
    ? data.tasks
    : Array.isArray(data.items)
      ? data.items
      : [];

  if (!tasks.length) {
    return renderEmpty(body, ctx, tokens);
  }

  const table = {
    headerHeight: tokens.table?.headerHeight ?? 24,
    rowHeight: tokens.table?.rowHeight ?? 22,
    paddingX: tokens.table?.cellPaddingX ?? 8,
    radius: tokens.table?.radius ?? 0,
    columns: data.columns ?? [
      { key: 'owner', title: 'Owner', width: 0.22 },
      { key: 'task', title: 'Task', width: 0.58 },
      { key: 'due', title: 'Due', width: 0.20 }
    ]
  };

  const colors = {
    headerFill: tokens.colors?.tableHeader ?? '#F3F4F6',
    rowFill: tokens.colors?.surface ?? '#FFFFFF',
    rowAltFill: tokens.colors?.surfaceAlt ?? '#FAFAFA',
    border: tokens.colors?.border ?? '#E5E7EB'
  };

  const type = {
    header: tokens.typography?.tableHeader ?? {
      font:'Helvetica-Bold', size:10, lineHeight:14, color:'#111827'
    },
    body: tokens.typography?.tableBody ?? {
      font:'Helvetica', size:10, lineHeight:14, color:'#374151'
    },
    empty: tokens.typography?.empty ?? {
      font:'Helvetica', size:11, lineHeight:16, color:'#9CA3AF'
    }
  };

  let x = body.x;

  for (const col of table.columns) {
    const w = body.width * col.width;

    ctx.rect({
      x,y:body.y,width:w,height:table.headerHeight,
      fill:colors.headerFill,
      stroke:colors.border,
      radius:table.radius
    });

    ctx.text(col.title,{
      x:x+table.paddingX,
      y:body.y+5,
      width:w-table.paddingX*2,
      height:type.header.lineHeight,
      font:type.header.font,
      size:type.header.size,
      color:type.header.color,
      lineHeight:type.header.lineHeight,
      align:'left',
      valign:'top',
      wrap:false
    });

    x += w;
  }

  tasks.forEach((task,rowIndex)=>{

    let cx = body.x;
    const y = body.y + table.headerHeight + rowIndex*table.rowHeight;

    table.columns.forEach(col=>{

      const w = body.width * col.width;

      ctx.rect({
        x:cx,
        y,
        width:w,
        height:table.rowHeight,
        fill: rowIndex % 2 ? colors.rowAltFill : colors.rowFill,
        stroke:colors.border,
        radius:0
      });

      let value='';

      switch(col.key){
        case 'owner':
          value = task.owner ?? '';
          break;
        case 'task':
          value = task.task ?? task.title ?? '';
          break;
        case 'due':
          value = task.dueDate ?? task.deadline ?? task.due_date ?? '';
          break;
        default:
          value = task[col.key] ?? '';
      }

      ctx.text(String(value),{
        x:cx+table.paddingX,
        y:y+4,
        width:w-table.paddingX*2,
        height:table.rowHeight-8,
        font:type.body.font,
        size:type.body.size,
        color:type.body.color,
        lineHeight:type.body.lineHeight,
        align:'left',
        valign:'top',
        wrap:false
      });

      cx += w;

    });

  });

};

function renderEmpty(body,ctx,tokens){

  const t = tokens.typography?.empty ?? {
    font:'Helvetica',
    size:11,
    lineHeight:16,
    color:'#9CA3AF'
  };

  ctx.text('No tasks',{
    x:body.x,
    y:body.y,
    width:body.width,
    height:body.height,
    font:t.font,
    size:t.size,
    color:t.color,
    lineHeight:t.lineHeight,
    align:'left',
    valign:'top',
    wrap:false
  });

}
