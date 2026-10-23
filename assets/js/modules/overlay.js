export function updateOverlaySize() {
    const o = globalThis.borderOverlay;
    const c = globalThis.container;
    o.style.top = `calc(${c.offsetTop}px - var(--border-size) / 2)`;
    o.style.left = `calc(${getComputedStyle(c).marginLeft} - var(--border-size) / 2)`;
    o.style.width = `calc(${getComputedStyle(c).width} + var(--border-size))`;
    o.style.height = `calc(${getComputedStyle(c).height} + var(--border-size))`;
}
