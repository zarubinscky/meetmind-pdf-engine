# Integration Map

## Целевой pipeline

```text
report_json
    ↓
composeExecutiveReport(report_json)
    ↓
CompositionResult
    ↓
MeetMindLayoutEngine.layout(CompositionResult)
    ↓
LayoutResult
    ↓
MeetMindRenderer.render(LayoutResult, RenderContext)
    ↓
Drawing Surface
    ↓
PDF / SVG / Canvas
```

## Browser wiring

```html
<script src="./layout-engine.js"></script>
<script src="./renderer.js"></script>
<script src="./render-context.js"></script>
<script src="./pdf-pipeline.js"></script>

<script type="module">
  import { composeExecutiveReport } from './composition-engine.js';

  const renderContext = MeetMindRenderContext.create(drawingSurface, {
    tokens: ExecutiveSlideEngine.designSystem
  });

  const pipeline = MeetMindPdfPipeline.create({
    compose: composeExecutiveReport,
    layout: MeetMindLayoutEngine.layout,
    render: (layoutResult, context) =>
      MeetMindRenderer.render(layoutResult, context, {
        blockRegistry: ExecutiveSlideEngine.blockRegistry,
        blockRenderers: ExecutiveSlideEngine.blockRenderers
      })
  });

  const result = pipeline.run(reportJson, {
    renderContext,
    composition: {},
    layout: {}
  });
</script>
```

## Frozen invocation contract

Each Block Renderer receives exactly:

```js
blockRenderer(block, pageContext)
```

`block.geometry` contains:

```js
{
  x,
  y,
  width,
  height
}
```

The Block Renderer must not:

- move the block;
- change its dimensions;
- paginate;
- measure for layout decisions;
- transfer content to another page.

