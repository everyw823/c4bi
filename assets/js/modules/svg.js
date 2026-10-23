import { generateUID } from './uid.js';


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

