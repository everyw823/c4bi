import { generateUID } from './utils.js';

/**
 * 在容器里撒一层小几何图形做装饰。
 *
 * 模板里给一个空的定位容器即可：
 *   <div class="decor-shapes flex-1" aria-hidden="true"
 *        data-seed="{{ $page.RelPermalink }}"></div>
 * 然后在 main.js 里调用 initDecorShapes()。
 *
 * data-seed     可选。种子决定这一份分布；同一页面得到同一套图形，
 *               刷新或返回列表时不会重新洗牌（不给就用随机种子）。
 * data-shapes   可选。逗号分隔，限定形状：dot, ring, square, diamond,
 *               triangle, cross, x。默认全部。
 * data-count    可选。强制数量，默认按容器面积推算。
 * data-density  可选。每 1000px² 的图形数，默认 0.9。
 * data-max      可选。自动推算时的上限，默认 28。
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

const ALL_SHAPES = ['dot', 'ring', 'square', 'diamond', 'triangle', 'cross', 'x'];

// 取色用的主题变量 + 每个颜色配的透明度。浅色/深色下主题变量是一致的，
// 所以靠低透明度让图形在两种底色上都不抢眼。
const PALETTE = [
    ['--color-secondary-400', 0.38],
    ['--color-secondary-500', 0.26],
    ['--color-accent-600', 0.34],
    ['--color-primary-400', 0.30],
];

const FALLBACK_COLORS = {
    '--color-secondary-400': '#94a3b8',
    '--color-secondary-500': '#64748b',
    '--color-accent-600': '#8ea701',
    '--color-primary-400': '#6f80c3',
};

let paletteCache = null;

function getPalette() {
    if (paletteCache) { return paletteCache; }
    const root = getComputedStyle(document.documentElement);
    paletteCache = PALETTE.map(([name, opacity]) => ({
        color: root.getPropertyValue(name).trim() || FALLBACK_COLORS[name],
        opacity,
    }));
    return paletteCache;
}

/** FNV-1a：把任意字符串折成一个 32 位种子。 */
function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

/** mulberry32：小、快、够随机的确定性 PRNG。 */
function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function svgEl(name, attrs) {
    const node = document.createElementNS(SVG_NS, name);
    for (const key in attrs) { node.setAttribute(key, attrs[key]); }
    return node;
}

// 全部在 24×24 的坐标里画，具体尺寸交给外层 <svg> 的 width/height 决定。
const SHAPE_BUILDERS = {
    dot: () => [svgEl('circle', { cx: 12, cy: 12, r: 9.5, fill: 'currentColor' })],
    ring: () => [svgEl('circle', {
        cx: 12, cy: 12, r: 8.5, fill: 'none',
        stroke: 'currentColor', 'stroke-width': 3.4,
    })],
    square: () => [svgEl('rect', { x: 4, y: 4, width: 16, height: 16, fill: 'currentColor' })],
    diamond: () => [svgEl('polygon', { points: '12,1 23,12 12,23 1,12', fill: 'currentColor' })],
    triangle: () => [svgEl('polygon', {
        points: '12,2.5 22,21.5 2,21.5', fill: 'currentColor',
        'stroke-linejoin': 'round',
    })],
    cross: () => [svgEl('path', {
        d: 'M12 3v18M3 12h18', fill: 'none', stroke: 'currentColor',
        'stroke-width': 3.2, 'stroke-linecap': 'round',
    })],
    x: () => [svgEl('path', {
        d: 'M5 5l14 14M19 5L5 19', fill: 'none', stroke: 'currentColor',
        'stroke-width': 3.2, 'stroke-linecap': 'round',
    })],
};

/**
 * 抖动网格取点：把容器切成列/行，每格放一个点再随机偏移，
 * 这样既有随机感，又不会出现某片区域空着、另一片挤成一团。
 */
function jitteredPoints(width, height, count, rand) {
    const cols = Math.max(1, Math.round(Math.sqrt((count * width) / height)));
    const rows = Math.max(1, Math.ceil(count / cols));
    const points = [];
    for (let r = 0; r < rows && points.length < count; r++) {
        for (let c = 0; c < cols && points.length < count; c++) {
            points.push({
                x: ((c + 0.5 + (rand() - 0.5) * 0.72) / cols) * width,
                y: ((r + 0.5 + (rand() - 0.5) * 0.72) / rows) * height,
            });
        }
    }
    return points;
}

function parseKinds(raw) {
    if (!raw) { return ALL_SHAPES; }
    const picked = raw.split(',')
        .map(s => s.trim())
        .filter(s => s in SHAPE_BUILDERS);
    return picked.length ? picked : ALL_SHAPES;
}

/**
 * 往一个元素里撒图形。重复调用是安全的（已撒过的会被跳过）。
 * @param {Element} field 已定位或待定位的容器
 */
export function scatterShapes(field) {
    if (!field || field.dataset.decorReady === 'true') { return; }

    const data = field.dataset;
    const kinds = parseKinds(data.shapes);
    const density = Number.parseFloat(data.density) || 0.9;   // 每 1000px²
    const maxCount = Number.parseInt(data.max, 10) || 28;
    const fixedCount = Number.parseInt(data.count, 10) || 0;
    const seed = data.seed ? hashString(data.seed) : hashString(generateUID(8, 'a'));

    const draw = () => {
        const rect = field.getBoundingClientRect();
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        // 太窄的容器（比如手机上 tags 占满整行）先不画，等布局变大重试。
        if (width < 24 || height < 12) { return false; }

        const rand = mulberry32(seed);
        const count = fixedCount || Math.max(1, Math.min(maxCount, Math.round((width * height / 1000) * density)));
        const palette = getPalette();
        const baseSize = Math.min(Math.max(height * 0.26, 3), 12);

        field.replaceChildren();
        field.dataset.decorReady = 'true';
        if (getComputedStyle(field).position === 'static') {
            field.style.position = 'relative';
        }

        jitteredPoints(width, height, count, rand).forEach(point => {
            const kind = kinds[Math.floor(rand() * kinds.length)];
            const tone = palette[Math.floor(rand() * palette.length)];
            const size = baseSize * (0.55 + rand() * 0.75);
            const rotation = Math.round(rand() * 90);

            const svg = document.createElementNS(SVG_NS, 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('width', size.toFixed(2));
            svg.setAttribute('height', size.toFixed(2));
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('focusable', 'false');
            svg.setAttribute('class', 'decor-shape');
            svg.style.cssText = [
                'position: absolute',
                `left: ${(point.x / width * 100).toFixed(3)}%`,
                `top: ${(point.y / height * 100).toFixed(3)}%`,
                `transform: translate(-50%, -50%) rotate(${rotation}deg)`,
                'overflow: visible',
                'pointer-events: none',
                `color: ${tone.color}`,
                `opacity: ${(tone.opacity * (0.7 + rand() * 0.6)).toFixed(2)}`,
            ].join('; ');

            SHAPE_BUILDERS[kind]().forEach(node => svg.appendChild(node));
            field.appendChild(svg);
        });

        return true;
    };

    // 尺寸为 0（隐藏、或初始化时还没完成布局）就等一次真实的尺寸变化。
    if (!draw()) {
        if (typeof ResizeObserver === 'function') {
            const observer = new ResizeObserver(() => { if (draw()) { observer.disconnect(); } });
            observer.observe(field);
        } else {
            window.addEventListener('load', () => draw(), { once: true });
        }
    }
}

/** 初始化页面上所有装饰容器。 */
export function initDecorShapes(selector = '.decor-shapes') {
    document.querySelectorAll(selector).forEach(scatterShapes);
}
