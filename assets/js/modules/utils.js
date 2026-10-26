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
