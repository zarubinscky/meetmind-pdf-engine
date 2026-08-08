/**
 * MeetMind Executive PDF Engine
 * RenderContext — Golden Release 1.0
 *
 * Page-scoped adapter between top-left Layout coordinates and pdf-lib's
 * bottom-left drawing coordinates. Also resolves Inter fonts and HEX colors.
 */
export class RenderContext {
  constructor(drawingSurface, tokens = null, options = {}) {
    this.surface = drawingSurface;
    this.tokens = tokens || {};
    this.report = options.report || null;
    this.rgb = options.rgb || null;
    this.defaultPageSize = options.pageSize || [
      this.tokens?.page?.width || 768,
      this.tokens?.page?.height || 512
    ];
  }

  getPageContext(pageSpec = {}) {
    const root = this;
    const size = pageSpec.size || { width: root.defaultPageSize[0], height: root.defaultPageSize[1] };
    const width = Number(size.width || root.defaultPageSize[0]);
    const height = Number(size.height || root.defaultPageSize[1]);
    const density = pageSpec.resolvedDensity || pageSpec.density || 'regular';
    let page = null;

    function color(value) {
      if (!value) return undefined;
      if (typeof value !== 'string') return value;
      let hex = value;
      if (root.tokens?.colors?.[value]) hex = root.tokens.colors[value];
      if (!/^#[0-9a-f]{6}$/i.test(hex) || typeof root.rgb !== 'function') return value;
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return root.rgb(r, g, b);
    }

    function font(value) {
      if (!value) return root.surface.getFont('regular');
      if (typeof value !== 'string') return value;
      return root.surface.getFont(value) || root.surface.getFont('regular');
    }

    return {
      tokens: root.tokens,
      report: root.report,
      density,
      pageWidth: width,
      pageHeight: height,

      beginPage() {
        page = root.surface.addPage([width, height]);
        return page;
      },
      endPage() {},
      get page() { return page; },

      text(value, options = {}) {
        const sizePt = Number(options.size || 8);
        const topY = Number(options.y || 0);
        return root.surface.drawText(String(value ?? ''), {
          x: Number(options.x || 0),
          y: height - topY - sizePt,
          size: sizePt,
          font: font(options.font),
          color: color(options.color),
          rotate: options.rotate
        });
      },

      rect(options = {}) {
        const h = Number(options.height || 0);
        const topY = Number(options.y || 0);
        return root.surface.drawRect({
          x: Number(options.x || 0),
          y: height - topY - h,
          width: Number(options.width || 0),
          height: h,
          radius: Number(options.radius || 0),
          borderWidth: Number(options.borderWidth ?? options.strokeWidth ?? 0.5),
          color: color(options.fill || options.color),
          borderColor: color(options.stroke || options.borderColor),
          opacity: options.opacity
        });
      },

      line(options = {}) {
        const start = options.start || { x: options.x1, y: options.y1 };
        const end = options.end || { x: options.x2, y: options.y2 };
        return root.surface.drawLine({
          start: { x: Number(start.x || 0), y: height - Number(start.y || 0) },
          end: { x: Number(end.x || 0), y: height - Number(end.y || 0) },
          thickness: Number(options.thickness || options.width || 1),
          color: color(options.color || options.stroke)
        });
      },

      circle(options = {}) {
        return root.surface.drawCircle({
          x: Number(options.x || 0),
          y: height - Number(options.y || 0),
          radius: Number(options.radius || options.size || 1),
          size: Number(options.size || options.radius || 1),
          color: color(options.fill || options.color),
          borderColor: color(options.stroke || options.borderColor),
          borderWidth: Number(options.borderWidth || 0)
        });
      },

      svgPath(path, options = {}) {
        const size = Number(options.size || 24);
        const scale = size / 24;
        const topY = Number(options.y || 0);
        return root.surface.drawSvgPath(path, {
          x: Number(options.x || 0),
          // pdf-lib SVG paths use their own local Y axis. Anchor the 24x24
          // icon viewport at the requested top-left position.
          y: height - topY - size,
          scale,
          color: options.fill ? color(options.fill) : undefined,
          borderColor: color(options.stroke || options.color),
          borderWidth: Number(options.borderWidth ?? 0.8),
          opacity: options.opacity ?? 1
        });
      },

      image(key, bytes, options = {}) {
        const h = Number(options.height || 0);
        return root.surface.drawImage(key, bytes, {
          ...options,
          y: height - Number(options.y || 0) - h
        });
      },

      measureText(text, fontName, sizePt) {
        return root.surface.measureText(text, fontName, sizePt);
      },
      getFont(name) { return root.surface.getFont(name); }
    };
  }

  finalize() {}
  save() { return this.surface.save(); }
}
