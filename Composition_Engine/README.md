# MeetMind Composition Engine v1.0

This iteration implements the first stage of the frozen pipeline:

`report_json → CompositionResult`

## Files

- `composition-types.js` — canonical identifiers and public JSDoc contracts.
- `composition-rules.js` — centralized thresholds and frozen business rules.
- `composition-engine.js` — normalization, visibility, measurement, density, adaptive composition, and pagination.

## Deliberately excluded

- coordinates;
- drawing;
- PDF generation;
- RenderContext integration;
- block renderer changes.

Those belong to Layout Engine and Renderer iterations.

## Public entry point

```js
import { composeExecutiveReport } from "./composition-engine.js";

const result = composeExecutiveReport(reportJson, {
  visibility: {
    owners: false,
  },
  pageCapacity: 100,
  allowSecondPage: true,
});
```

## Important guarantees

- Canonical business order is preserved.
- Risks never move above Insights or Decisions.
- Tasks remain a distinct table block.
- Architecture remains data-driven.
- Overflow transfer order is Architecture → Owners → Tasks.
- Page 2 is a continuation and repeats only Header/Footer at composition level.
- No coordinates or rendering decisions leak into this layer.


## v1.1 roadmap

Composition blocks are now intended to be enriched through subsequent pipeline stages (Layout -> Renderer) instead of being transformed into separate models.

