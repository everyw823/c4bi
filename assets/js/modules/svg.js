import { generateUID } from './utils.js';


/**
 * Let an injected SVG scale with its parent box.
 *
 * Design tools bake absolute `width` / `height` attributes into the root
 * element (here: width="93.71" height="96.71"). CSS beats those attributes, so
 * `width: 100%` alone does widen the box — but the height stays pinned at
 * 96.71 and the artwork is only letterboxed inside it. Dropping the two
 * attributes keeps just the viewBox, letting the browser derive the height
 * from the aspect ratio, so `width: 100%; height: auto` scales like an <img>.
 */
export function makeResponsive(svgElement) {
    const box = svgElement.viewBox && svgElement.viewBox.baseVal;
    if (!box || !box.width || !box.height) {
        // No usable viewBox: synthesise one from the hard-coded size, otherwise
        // there would be no aspect ratio left to scale against.
        const width = parseFloat(svgElement.getAttribute('width'));
        const height = parseFloat(svgElement.getAttribute('height'));
        if (!width || !height) { return; }
        svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }

    svgElement.removeAttribute('width');
    svgElement.removeAttribute('height');
}


export function tintSVG(svgElement, strokeColor, fillColor) {
    const uuid = "c" + generateUID(6, 'a');

    svgElement.querySelectorAll('[stroke]').forEach(el => {
        if (el.getAttribute('stroke') !== 'none') {
            el.setAttribute('stroke', strokeColor);
        }
    });

    svgElement.querySelectorAll('[fill]').forEach(el => {
        if (el.getAttribute('fill') !== 'none') {
            el.setAttribute('fill', fillColor);
        }
    });

    const svgStyle = svgElement.querySelector('style');
    if (svgStyle) {
        svgStyle.textContent = svgStyle.textContent
            .replace(/stroke:\s*#[0-9a-fA-F]{3,6}/g, `stroke: ${strokeColor}`)
            .replace(/fill:\s*#[0-9a-fA-F]{3,6}/g, `fill: ${fillColor}`);

        const c = [];
        svgStyle.textContent.matchAll(/\.([^0-9]\S*)\s*[\,,{]/g).forEach(e => {
            c.push(e[1]);
        });
        const classes = c.filter((item, index) => c.indexOf(item) === index);

        classes.forEach(e => {
            svgElement.innerHTML = svgElement.innerHTML.replaceAll(e, () => `${uuid}-${e}`);
        });
    }
}

