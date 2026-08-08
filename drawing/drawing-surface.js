/**
 * drawing-surface.js
 * MeetMind Executive PDF Engine
 * Status: READY FOR GITHUB — 6D compatible
 *
 * Low-level drawing backend.
 * Owns only PDF primitives.
 */

export class DrawingSurface {
  constructor(pdfDocument) {
    this.pdf = pdfDocument;
    this.currentPage = null;
    this.pages = [];
    this.fonts = new Map();
    this.images = new Map();
  }

  static async create({ PDFDocument, fontkit }) {
    const pdf = await PDFDocument.create();
    if (fontkit) pdf.registerFontkit(fontkit);
    return new DrawingSurface(pdf);
  }

  async registerFont(name, bytes) {
    if (this.fonts.has(name)) return this.fonts.get(name);
    const font = await this.pdf.embedFont(bytes);
    this.fonts.set(name, font);
    return font;
  }

  getFont(name) {
    return this.fonts.get(name);
  }

  addPage(size = [842, 595]) {
    const page = this.pdf.addPage(size);
    this.pages.push(page);
    this.currentPage = page;
    return page;
  }

  getCurrentPage() {
    return this.currentPage;
  }

  setCurrentPage(page) {
    this.currentPage = page;
  }

  drawText(text, {x,y,size=12,font,color,rotate} = {}) {
    this.#assertPage();
    this.currentPage.drawText(String(text ?? ""), {
      x,y,size,font,color,rotate
    });
  }

  drawRect({x,y,width,height,radius=0,borderWidth=1,color,borderColor,opacity} = {}) {
    this.#assertPage();
    // radius reserved for future backend support
    this.currentPage.drawRectangle({
      x,y,width,height,borderWidth,color,borderColor,opacity
    });
  }

  drawCircle({x,y,radius,size,color,borderColor,borderWidth=1} = {}) {
    this.#assertPage();
    if (typeof this.currentPage.drawCircle === "function") {
      this.currentPage.drawCircle({
        x,y,size:size ?? radius,color,borderColor,borderWidth
      });
    } else {
      throw new Error("PDF backend does not support drawCircle().");
    }
  }

  drawLine({start,end,thickness=1,color} = {}) {
    this.#assertPage();
    this.currentPage.drawLine({start,end,thickness,color});
  }

  drawSvgPath(path, {x=0,y=0,scale=1,color,borderColor,borderWidth=1,opacity=1} = {}) {
    this.#assertPage();
    if (typeof this.currentPage.drawSvgPath !== "function") {
      throw new Error("PDF backend does not support drawSvgPath().");
    }
    this.currentPage.drawSvgPath(String(path || ""), {
      x, y, scale,
      color,
      borderColor,
      borderWidth,
      opacity
    });
  }

  async drawImage(key, bytes, options = {}) {
    this.#assertPage();
    let image = this.images.get(key);
    if (!image) {
      try { image = await this.pdf.embedPng(bytes); }
      catch { image = await this.pdf.embedJpg(bytes); }
      this.images.set(key,image);
    }
    this.currentPage.drawImage(image, options);
  }

  measureText(text, fontName, size = 12) {
    const font = this.fonts.get(fontName);
    if (!font) return String(text ?? "").length * size * 0.55;
    return font.widthOfTextAtSize(String(text ?? ""), size);
  }

  async save() {
    return this.pdf.save();
  }

  #assertPage() {
    if (!this.currentPage) {
      throw new Error("DrawingSurface: no active page.");
    }
  }
}
