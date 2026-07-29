# CHANGELOG

## 0.4.0 — Renderer Integration

### Added

- Dependency-injected PDF pipeline.
- Renderer compatible with `block.geometry`.
- Page-scoped RenderContext factory.
- Block Registry and Block Renderer resolution.
- Existing `ExecutiveSlideEngine` namespace compatibility.
- End-to-end contract smoke test.
- Drawing Surface abstraction.

### Fixed

- Removed the old Renderer assumption that LayoutResult must expose
  geometry only as top-level `block.x/y/width/height`.
- Removed the old assumption that one global RenderContext is sufficient
  for all pages.

### Not included

- Final visual polish.
- A selected production PDF library adapter.
- Final repository cleanup.
- Release 1.0 bundle.

