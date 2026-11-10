// credit: https://www.bayescafe.com/webfrontend/generate-random-string-in-javascript.html
//         http://stackoverflow.com/questions/6248666/how-to-generate-short-uid-like-ax4j9z-in-js
export function generateUID(length, fill) {
    return (fill.repeat(length) + (Math.random() * Math.pow(36, length) << 0).toString(36)).slice(length * -1);
}

export function Hex2NormalizedRGB(hs){
    let hex = hs.match(/\#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/);
    let r = parseInt(hex[1],16) / 256;
    let g = parseInt(hex[2],16) / 256;
    let b = parseInt(hex[3],16) / 256;
    return [r,g,b]
}

// Strings handed over from Hugo in the <script id="i18n-data"> island.
// Read lazily once and cached, so this works regardless of load order.
let translations = null;

export function i18n(key, fallback = '') {
    if (translations === null) {
        const el = document.getElementById('i18n-data');
        try {
            translations = el ? JSON.parse(el.textContent) : {};
        } catch (e) {
            console.warn('i18n: could not parse #i18n-data', e);
            translations = {};
        }
    }
    return (translations[key] != null) ? translations[key] : fallback;
}
