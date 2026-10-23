// credit: https://www.bayescafe.com/webfrontend/generate-random-string-in-javascript.html
//         http://stackoverflow.com/questions/6248666/how-to-generate-short-uid-like-ax4j9z-in-js
export function generateUID(length, fill) {
    return (fill.repeat(length) + (Math.random() * Math.pow(36, length) << 0).toString(36)).slice(length * -1);
}
