(function (global) {
    'use strict';
     const ENGINE_BASE =
        'https://zarubinscky.github.io/meetmind-pdf-engine/';

    const ENGINE_NAME = 'ExecutiveSlideEngine';
    const ENGINE_VERSION = '0.1.0-mvp';

    const MODULE_PATHS = Object.freeze({
        composition: './Composition_Engine/composition-engine.js',
        layout: './Layout_Engine/layout-engine.js',
        drawingSurface: './drawing/drawing-surface.js'
    });

    const PDF_LIB_CDN =
        'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';

    const PAGE_SIZE = Object.freeze([842, 595]);
    const BLOCK_TITLES = Object.freeze({
        header: '',
        stats: '',
        summary: 'Executive Summary',
        metrics: 'Key Metrics',
        insights: 'Insights',
        decisions: 'Decisions',
        risks: 'Risks',
        tasks: 'Tasks',
        architecture: 'Architecture',
        owners: 'Owners',
        footer: ''
    });

    let dependenciesPromise = null;

    function loadClassicScript(src) {
        return new Promise((resolve, reject) => {
            const existing = Array.from(document.scripts)
                .find(script => script.src === src);

            if (existing) {
                if (global.PDFLib?.PDFDocument) {
                    resolve();
                    return;
                }

                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;

            script.addEventListener('load', resolve, { once: true });
            script.addEventListener('error', () => {
                reject(new Error(`Failed to load script: ${src}`));
            }, { once: true });

            document.head.appendChild(script);
        });
    }

    async function ensurePdfLib() {
        if (global.PDFLib?.PDFDocument) {
            return global.PDFLib;
        }

        await loadClassicScript(PDF_LIB_CDN);

        if (!global.PDFLib?.PDFDocument) {
            throw new Error(
                'PDFLib was not found. Add pdf-lib to the page or allow loading from jsDelivr.'
            );
        }

        return global.PDFLib;
    }

    async function loadDependencies() {
        if (dependenciesPromise) {
            return dependenciesPromise;
        }

        dependenciesPromise = (async () => {
           const [

    compositionModule,

    drawingModule,

    pdfLib

] = await Promise.all([

    import(ENGINE_BASE + 'Composition_Engine/composition-engine.js'),

    import(ENGINE_BASE + 'drawing/drawing-surface.js'),

    ensurePdfLib(),

    import(ENGINE_BASE + 'Layout_Engine/layout-engine.js')

]);

            const compose =
                compositionModule.composeExecutiveReport ||
                compositionModule.default?.composeExecutiveReport;

            const DrawingSurface =
                drawingModule.DrawingSurface ||
                drawingModule.default?.DrawingSurface;

            const layout =
                global.MeetMindLayoutEngine?.layout;

            if (typeof compose !== 'function') {
                throw new Error(
                    'Composition Engine did not export composeExecutiveReport().'
                );
            }

            if (typeof layout !== 'function') {
                throw new Error(
                    'Layout Engine did not expose MeetMindLayoutEngine.layout().'
                );
            }

            if (typeof DrawingSurface !== 'function') {
                throw new Error(
                    'drawing-surface.js did not export DrawingSurface.'
                );
            }

            return Object.freeze({
                compose,
                layout,
                DrawingSurface,
                PDFDocument: pdfLib.PDFDocument,
                StandardFonts: pdfLib.StandardFonts,
                rgb: pdfLib.rgb
            });
        })();

        return dependenciesPromise;
    }

    function isPlainObject(value) {
        return Boolean(value) &&
            typeof value === 'object' &&
            !Array.isArray(value);
    }

    function buildCompositionOptions(options) {
        if (isPlainObject(options.composition)) {
            return options.composition;
        }

        const visibility = {};
        const source =
            options.visibility ||
            options.blocks ||
            options.selectedBlocks ||
            null;

        if (isPlainObject(source)) {
            for (const [key, value] of Object.entries(source)) {
                visibility[normalizeBlockId(key)] = Boolean(value);
            }
        }

        return {
            visibility,
            allowSecondPage: options.allowSecondPage !== false,
            preferredDensity: options.preferredDensity,
            pageCapacity: options.pageCapacity
        };
    }

    function normalizeBlockId(value) {
        const token = String(value || '')
            .trim()
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .toLowerCase()
            .replace(/[\s-]+/g, '_');

        const aliases = {
            meeting_stats: 'stats',
            executive_summary: 'summary',
            key_metrics: 'metrics',
            participants: 'owners',
            action_items: 'tasks'
        };

        return aliases[token] || token;
    }

    function cleanText(value) {
        return String(value ?? '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function valueFromObject(item, keys) {
        for (const key of keys) {
            const value = item?.[key];
            if (value !== undefined && value !== null && cleanText(value)) {
                return cleanText(value);
            }
        }
        return '';
    }

    function formatTask(task) {
        if (!isPlainObject(task)) {
            return cleanText(task);
        }

        const text = valueFromObject(task, [
            'task', 'title', 'description', 'text'
        ]);
        const owner = valueFromObject(task, [
            'owner', 'assignee', 'responsible'
        ]);
        const due = valueFromObject(task, [
            'due', 'due_date', 'dueDate', 'deadline'
        ]);

        return [
            text,
            owner ? `Owner: ${owner}` : '',
            due ? `Due: ${due}` : ''
        ].filter(Boolean).join(' — ');
    }

    function formatListItem(item) {
        if (!isPlainObject(item)) {
            return cleanText(item);
        }

        const primary = valueFromObject(item, [
            'title', 'name', 'task', 'item', 'text',
            'decision', 'risk', 'insight', 'owner'
        ]);

        const secondary = valueFromObject(item, [
            'description', 'details', 'reason',
            'responsibility', 'value'
        ]);

        return [primary, secondary]
            .filter(Boolean)
            .join(' — ');
    }

    function blockLines(block) {
        const data = block.data;

        if (block.id === 'tasks' && Array.isArray(data)) {
            return data.map(formatTask).filter(Boolean);
        }

        if (typeof data === 'string' || typeof data === 'number') {
            return [cleanText(data)].filter(Boolean);
        }

        if (Array.isArray(data)) {
            return data.map(formatListItem).filter(Boolean);
        }

        if (!isPlainObject(data)) {
            return [];
        }

        const preferredArrays = [
            data.items,
            data.rows,
            data.sections,
            data.metrics,
            data.tasks
        ];

        for (const candidate of preferredArrays) {
            if (Array.isArray(candidate) && candidate.length > 0) {
                return candidate.map(formatListItem).filter(Boolean);
            }
        }

        const preferredText = valueFromObject(data, [
            'text', 'summary', 'description', 'details', 'value'
        ]);

        if (preferredText) {
            return [preferredText];
        }

        return Object.entries(data)
            .filter(([, value]) =>
                value !== null &&
                value !== undefined &&
                cleanText(value)
            )
            .map(([key, value]) =>
                `${humanize(key)}: ${cleanText(value)}`
            );
    }

    function humanize(value) {
        return String(value || '')
            .replace(/[_-]+/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    }

    function estimateWidth(text, fontSize) {
    return String(text).length * fontSize * 0.56;
}

function wrapText(text, font, size, maxWidth) {
    const words = cleanText(text).split(' ').filter(Boolean);

    if (words.length === 0) return [];

    const lines = [];
    let current = '';

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;

        if (estimateWidth(candidate, size) <= maxWidth) {
            current = candidate;
            continue;
        }

        if (current) {
            lines.push(current);
        }

        if (estimateWidth(word, size) <= maxWidth) {
            current = word;
            continue;
        }

        let fragment = '';

        for (const char of word) {
            const next = fragment + char;

            if (estimateWidth(next, size) <= maxWidth) {
                fragment = next;
            } else {
                if (fragment) {
                    lines.push(fragment);
                }

                fragment = char;
            }
        }
        current = fragment;
    }

    if (current) {
        lines.push(current);
    }
    return lines;
}

    function geometryToPdf(geometry, layoutSize, pdfSize) {
        const scaleX = pdfSize.width / layoutSize.width;
        const scaleY = pdfSize.height / layoutSize.height;

        return {
            x: geometry.x * scaleX,
            y: pdfSize.height -
                (geometry.y + geometry.height) * scaleY,
            width: geometry.width * scaleX,
            height: geometry.height * scaleY
        };
    }

    function drawBlock({
        surface,
        block,
        layoutSize,
        pdfSize,
        regularFont,
        boldFont,
        rgb
    }) {
        const sourceGeometry =
            block.layout?.geometry ||
            block.geometry;

        if (!sourceGeometry) {
            return;
        }

        const box = geometryToPdf(
            sourceGeometry,
            layoutSize,
            pdfSize
        );

        const border = rgb(0.83, 0.85, 0.88);
        const background = rgb(0.985, 0.987, 0.99);
        const primary = rgb(0.10, 0.12, 0.16);
        const secondary = rgb(0.34, 0.37, 0.43);

        if (block.id === 'header') {
            const title =
                cleanText(block.data?.title) ||
                'Untitled Meeting';
            const date = cleanText(block.data?.date);

            surface.drawText(title, {
                x: box.x,
                y: box.y + box.height - 25,
                size: 20,
                font: boldFont,
                color: primary
            });

            if (date) {
                surface.drawText(date, {
                    x: box.x,
                    y: box.y + 7,
                    size: 8.5,
                    font: regularFont,
                    color: secondary
                });
            }
            return;
        }

        if (block.id === 'footer') {
            surface.drawLine({
                start: { x: box.x, y: box.y + box.height },
                end: {
                    x: box.x + box.width,
                    y: box.y + box.height
                },
                thickness: 0.6,
                color: border
            });

            surface.drawText(
                cleanText(block.data?.text) ||
                    'Generated by MeetMind AI',
                {
                    x: box.x,
                    y: box.y + 5,
                    size: 7.5,
                    font: regularFont,
                    color: secondary
                }
            );
            return;
        }
        if (block.id === 'stats') {
            const value = blockLines(block).join('   •   ');

            if (value) {
                surface.drawText(value, {
                    x: box.x,
                    y: box.y + Math.max(7, box.height / 2 - 4),
                    size: 9,
                    font: boldFont,
                    color: secondary
                });
            }
            return;
        }

        surface.drawRect({
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            borderWidth: 0.7,
            color: background,
            borderColor: border,
            opacity: 1
        });

        const padding = 10;
        const titleSize = 10.5;
        const bodySize = block.id === 'summary' ? 9 : 8.3;
        const lineHeight = bodySize * 1.32;
        const title = BLOCK_TITLES[block.id] || humanize(block.id);

        surface.drawText(title, {
            x: box.x + padding,
            y: box.y + box.height - padding - titleSize,
            size: titleSize,
            font: boldFont,
            color: primary
        });

        const rawLines = blockLines(block);
        const wrapped = [];
        const availableWidth = Math.max(
            40,
            box.width - padding * 2
        );

        for (const rawLine of rawLines) {
            const bullet = block.id === 'summary' ? '' : '• ';
            const parts = wrapText(
                bullet + rawLine,
                regularFont,
                bodySize,
                availableWidth
            );
            wrapped.push(...parts);
        }

        const bodyTop =
            box.y + box.height - padding - titleSize - 12;
        const availableHeight =
            bodyTop - (box.y + padding);
        const maxLines = Math.max(
            0,
            Math.floor(availableHeight / lineHeight)
        );

        const visibleLines = wrapped.slice(0, maxLines);

        if (wrapped.length > maxLines && visibleLines.length > 0) {
            const lastIndex = visibleLines.length - 1;
            visibleLines[lastIndex] =
                visibleLines[lastIndex].replace(/[.…]*$/, '') + '…';
        }

        visibleLines.forEach((line, index) => {
            surface.drawText(line, {
                x: box.x + padding,
                y: bodyTop - index * lineHeight,
                size: bodySize,
                font: regularFont,
                color: secondary
            });
        });
    }

    async function renderPdf(layoutResult, dependencies) {
        const {
            DrawingSurface,
            PDFDocument,
            StandardFonts,
            rgb
        } = dependencies;

        const surface = await DrawingSurface.create({
            PDFDocument
        });

        const regularFont = await surface.pdf.embedFont(
            StandardFonts.Helvetica
        );
        const boldFont = await surface.pdf.embedFont(
            StandardFonts.HelveticaBold
        );

        for (const layoutPage of layoutResult.pages) {
            surface.addPage(PAGE_SIZE);

            const pdfSize = {
                width: PAGE_SIZE[0],
                height: PAGE_SIZE[1]
            };

            for (const block of layoutPage.blocks) {
                drawBlock({
                    surface,
                    block,
                    layoutSize: layoutPage.size,
                    pdfSize,
                    regularFont,
                    boldFont,
                    rgb
                });
            }
        }

        return surface.save();
    }

    global[ENGINE_NAME] = Object.freeze({
        name: ENGINE_NAME,
        version: ENGINE_VERSION,

        async generate(report, options = {}) {
            if (!isPlainObject(report)) {
                throw new TypeError(
                    'ExecutiveSlideEngine.generate(report): report must be an object.'
                );
            }

            console.log(
                `✅ MeetMind Executive PDF Engine ${ENGINE_VERSION} loaded`
            );

            const dependencies = await loadDependencies();

            const compositionResult = dependencies.compose(
                report,
                buildCompositionOptions(options)
            );

            const layoutResult = dependencies.layout(
                compositionResult,
                isPlainObject(options.layout)
                    ? options.layout
                    : {}
            );

            if (layoutResult.valid === false) {
                console.warn(
                    'MeetMind PDF layout contains validation warnings.',
                    layoutResult.diagnostics
                );
            }

            const pdfBytes = await renderPdf(
                layoutResult,
                dependencies
            );

            const blob = new Blob([pdfBytes], {
                type: 'application/pdf'
            });

            console.log('✅ MeetMind PDF generated', {
                pages: layoutResult.pageCount,
                bytes: pdfBytes.length
            });

            return blob;
        }
    });

})(window);
