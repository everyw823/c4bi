async function fetchImage(url) {
    const response = await fetch(url);
    const data = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');
    const pimage = doc.querySelector('img[origin=md]');

    if (!pimage) {
        return null;
    }
    const eleLink = doc.createElement('a');
    eleLink.href = url + pimage.getAttribute('src');
    return eleLink.href;
}

export function initImagePreviews() {
    const preview = document.querySelectorAll('.post-preview');
    preview.forEach(p => {
        const pa = p.querySelector('a');
        const pp = p.querySelector('img.img-preview');
        const wrapper = p.querySelector('.image-text-preview-wrapper');
        const url = pa.getAttribute('href');

        fetchImage(url).then(imageUrl => {
            if (imageUrl) {
                pp.setAttribute('src', imageUrl);
            } else {
                wrapper.style.gridTemplateColumns = '1fr';
                pp.remove();
            }
        });
    });
}
