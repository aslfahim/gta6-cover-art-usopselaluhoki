// Fixed scenes for screenshots: ?shot=editor shows the page with a sample photo;
// ?shot=cover shows the cover alone. `photo` picks the sample (samples/<photo>.jpg),
// `caption` the words and `size` the export size (square, portrait or wide).
// window.__shotReady is set once painted.
export async function runShot(shot, query, apply) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const size = query.get('size');
  await apply({
    photo: `samples/${query.get('photo') ?? 'pier'}.jpg`,
    caption: query.get('caption') ?? 'Beach Heist',
    size: size === 'portrait' || size === 'wide' ? size : 'square',
  });
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
