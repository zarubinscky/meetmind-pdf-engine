/**
 * render-context.js
 * Status: READY FOR GITHUB
 *
 * Thin adapter between Renderer and DrawingSurface.
 */

export class RenderContext {
  constructor(drawingSurface, tokens = null) {
    this.surface = drawingSurface;
    this.tokens = tokens;
  }

  get page() {
    return this.surface.getCurrentPage();
  }

  text(value, options) {
    return this.surface.drawText(value, options);
  }

  rect(options) {
    return this.surface.drawRect(options);
  }

  line(options) {
    return this.surface.drawLine(options);
  }

  circle(options) {
    return this.surface.drawCircle(options);
  }

  image(key, bytes, options) {
    return this.surface.drawImage(key, bytes, options);
  }

  measureText(text, fontName, size) {
    return this.surface.measureText(text, fontName, size);
  }

  getFont(name) {
    return this.surface.getFont(name);
  }

  addPage(size) {
    return this.surface.addPage(size);
  }

  setCurrentPage(page) {
    this.surface.setCurrentPage(page);
  }

  save() {
    return this.surface.save();
  }
}
