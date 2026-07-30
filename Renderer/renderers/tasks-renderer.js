/**
 * MeetMind Executive PDF Engine
 * Tasks Renderer
 *
 * Status: READY FOR GITHUB
 */
'use strict';

const { drawCard, drawSectionTitle, getContentRect } = require('./card-renderer');

module.exports = function renderTasks(block, ctx) {
  const geometry = block.geometry;
  const data = block.data ?? {};

  drawCard(ctx, geometry);
  drawSectionTitle(ctx, geometry, data.title ?? 'Tasks');

  const body = getContentRect(ctx, geometry);

  const tasks = Array.isArray(data.tasks)
    ? data.tasks
    : Array.isArray(data.items)
      ? data.items
      : [];

  if (!tasks.length) {
    ctx.text('No tasks', {
      x: body.x, y: body.y,
      width: body.width, height: body.height,
      font: 'Helvetica', size: 11,
      color: '#9CA3AF', lineHeight: 16,
      align: 'left', valign: 'top', wrap: false
    });
    return;
  }

  const columns = [
    { key: 'owner', title: 'Owner', width: 0.22 },
    { key: 'task', title: 'Task', width: 0.58 },
    { key: 'due', title: 'Due', width: 0.20 }
  ];

  const headerHeight = 24;
  const rowHeight = 22;

  let x = body.x;
  for (const col of columns) {
    const w = body.width * col.width;
    ctx.rect({ x, y: body.y, width: w, height: headerHeight, fill: '#F3F4F6', stroke: '#E5E7EB', radius: 0 });
    ctx.text(col.title, {
      x: x + 6, y: body.y + 5,
      width: w - 12, height: 14,
      font: 'Helvetica-Bold', size: 10,
      color: '#111827', lineHeight: 14,
      align: 'left', valign: 'top', wrap: false
    });
    x += w;
  }

  tasks.forEach((task, i) => {
    let cx = body.x;
    const y = body.y + headerHeight + i * rowHeight;

    columns.forEach(col => {
      const w = body.width * col.width;
      ctx.rect({ x: cx, y, width: w, height: rowHeight, fill: '#FFFFFF', stroke: '#E5E7EB', radius: 0 });

      let value = '';
      if (col.key === 'due') value = task.dueDate ?? task.deadline ?? task.due_date ?? '';
      else value = task[col.key] ?? '';

      ctx.text(String(value), {
        x: cx + 6, y: y + 4,
        width: w - 12, height: rowHeight - 8,
        font: 'Helvetica', size: 10,
        color: '#374151', lineHeight: 14,
        align: 'left', valign: 'top', wrap: false
      });

      cx += w;
    });
  });
};
