// Beach Heist cover renderer: three horizontal bands (sky / pier / sand) over a pastel
// sunset, a sticker-style caption with a white border, and two starburst badges.
// Everything drawn here is original art made with canvas shapes and gradients.

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

// One band of the cover: its share of the height, the placeholder gradient it falls
// back to when no photo is loaded, and the warm grade laid over its photo.
export const BANDS = [
  { name: 'Sky', frac: 0.38, base: ['#ffe3b3', '#ffb08a'], grade: 'rgba(255, 122, 89, 0.24)' },
  { name: 'Pier', frac: 0.32, base: ['#ffc2d4', '#ff8fa3'], grade: 'rgba(255, 94, 120, 0.22)' },
  { name: 'Sand', frac: 0.30, base: ['#ffe9a8', '#ffc46b'], grade: 'rgba(255, 170, 60, 0.22)' },
];

/** Band rectangles for a cover of the given size, in top-to-bottom order. */
export function bandRects(w, h) {
  const rects = [];
  let y = 0;
  for (const band of BANDS) {
    const bh = Math.round(h * band.frac);
    rects.push({ x: 0, y, w, h: bh });
    y += bh;
  }
  rects[rects.length - 1].h = h - rects[rects.length - 1].y;
  return rects;
}

/** Draws one band's photo, cover-fit at the band's zoom and pan offsets. */
function drawBandPhoto(ctx, photo, rect, band) {
  const iw = photo.naturalWidth;
  const ih = photo.naturalHeight;
  const scale = Math.max(rect.w / iw, rect.h / ih) * band.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + band.ox * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + band.oy * rect.h;
  ctx.drawImage(photo, dx, dy, dw, dh);
}

/** Placeholder art for a band with no photo yet: gradient, sun, waves or pier posts. */
function drawBandPlaceholder(ctx, rect, index) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grad.addColorStop(0, BANDS[index].base[0]);
  grad.addColorStop(1, BANDS[index].base[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  if (index === 0) {
    // Puffy clouds drifting across the sky band.
    for (const [cx, cy, r] of [[0.2, 0.35, 0.09], [0.55, 0.22, 0.07], [0.85, 0.42, 0.08]]) {
      ctx.beginPath();
      ctx.ellipse(rect.x + rect.w * cx, rect.y + rect.h * cy, rect.w * r, rect.h * r * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (index === 1) {
    // A simple pier deck with posts reaching into the water.
    ctx.fillStyle = 'rgba(120, 60, 70, 0.55)';
    ctx.fillRect(rect.x, rect.y + rect.h * 0.42, rect.w, rect.h * 0.1);
    for (let i = 0; i < 7; i++) {
      const px = rect.x + rect.w * (0.08 + i * 0.14);
      ctx.fillRect(px, rect.y + rect.h * 0.42, rect.w * 0.02, rect.h * 0.55);
    }
  } else {
    // Rolling sand ripples.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = Math.max(3, rect.h * 0.03);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const yy = rect.y + rect.h * (0.3 + i * 0.25);
      ctx.moveTo(rect.x + rect.w * 0.05, yy);
      ctx.bezierCurveTo(rect.x + rect.w * 0.3, yy - rect.h * 0.12, rect.x + rect.w * 0.7, yy + rect.h * 0.12, rect.x + rect.w * 0.95, yy);
      ctx.stroke();
    }
  }
}

/** A spiky starburst badge with centred text, drawn at (cx, cy) with radius r. */
function drawStarburst(ctx, cx, cy, r, fill, text, size) {
  const spikes = 14;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.78;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${size}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = text.split(' ');
  if (words.length > 1) {
    ctx.fillText(words[0], cx, cy - size * 0.55);
    ctx.fillText(words.slice(1).join(' '), cx, cy + size * 0.55);
  } else {
    ctx.fillText(text, cx, cy);
  }
  ctx.textBaseline = 'alphabetic';
}

/** A rounded pill with centred text. */
function drawPill(ctx, cx, cy, text, size) {
  ctx.font = `800 ${size}px system-ui, sans-serif`;
  const pad = size * 0.9;
  const tw = ctx.measureText(text).width;
  const pw = tw + pad * 2;
  const ph = size * 2.1;
  const x = cx - pw / 2;
  const y = cy - ph / 2;
  const r = ph / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + pw, y, x + pw, y + ph, r);
  ctx.arcTo(x + pw, y + ph, x, y + ph, r);
  ctx.arcTo(x, y + ph, x, y, r);
  ctx.arcTo(x, y, x + pw, y, r);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.fillStyle = '#26203a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + size * 0.06);
  ctx.textBaseline = 'alphabetic';
}

/**
 * Draws the whole cover onto the canvas at its own size.
 * `state` holds bands (photo, zoom, ox, oy), caption text/size/colour/outline,
 * subcaption, badges on/off and the selected band (unused here).
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#ffd9c2';
  ctx.fillRect(0, 0, w, h);

  const rects = bandRects(w, h);
  state.bands.forEach((band, i) => {
    const rect = rects[i];
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (band.photo) drawBandPhoto(ctx, band.photo, rect, band);
    else drawBandPlaceholder(ctx, rect, i);
    ctx.fillStyle = BANDS[i].grade;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  });

  // Thin white seams between the bands.
  ctx.fillStyle = '#ffffff';
  for (let i = 1; i < rects.length; i++) {
    ctx.fillRect(0, rects[i].y - Math.max(2, h * 0.003), w, Math.max(4, h * 0.006));
  }

  // A big low sun glowing in the sky band.
  const sunR = h * 0.085;
  const sunX = w * 0.8;
  const sunY = rects[0].y + rects[0].h * 0.52;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.4);
  glow.addColorStop(0, 'rgba(255, 214, 120, 0.85)');
  glow.addColorStop(1, 'rgba(255, 214, 120, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - sunR * 2.4, sunY - sunR * 2.4, sunR * 4.8, sunR * 4.8);
  const sun = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
  sun.addColorStop(0, '#fff6b0');
  sun.addColorStop(1, '#ff8a3d');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // A few birds sketched over the sky.
  ctx.strokeStyle = 'rgba(60, 30, 60, 0.7)';
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.lineCap = 'round';
  for (const [bx, by, s] of [[0.18, 0.08, 0.02], [0.3, 0.13, 0.015], [0.45, 0.07, 0.018]]) {
    ctx.beginPath();
    ctx.moveTo(w * (bx - s), h * by);
    ctx.quadraticCurveTo(w * bx, h * (by - s * 0.5), w * bx, h * by);
    ctx.quadraticCurveTo(w * (bx + s * 0.5), h * (by - s * 0.5), w * (bx + s), h * by);
    ctx.stroke();
  }

  // Starburst badges, top corners.
  if (state.badges) {
    const br = Math.min(w, h) * 0.085;
    drawStarburst(ctx, w * 0.11, h * 0.085, br, '#ff5d8f', '100% HEIST', Math.min(w, h) * 0.028);
    drawStarburst(ctx, w * 0.89, h * 0.085, br, '#12b5a5', 'VICE CITY', Math.min(w, h) * 0.028);
  }

  // The big sticker caption, tilted a touch, white border then coloured fill.
  const text = (state.caption || '').trim().toUpperCase();
  if (text) {
    let size = Math.min(w, h) * 0.115 * state.captionSize;
    ctx.font = `900 ${size}px system-ui, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(size * 0.04)}px`; } catch { /* older canvas */ }
    while (ctx.measureText(text).width > w * 0.92 && size > 14) {
      size -= 2;
      ctx.font = `900 ${size}px system-ui, sans-serif`;
    }
    const capY = h * 0.66;
    ctx.save();
    ctx.translate(w / 2, capY);
    ctx.rotate(-0.045);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    if (state.captionOutline) {
      // Dark outer edge first so the white sticker border reads on light photos,
      // then the white border, then the coloured fill.
      ctx.lineWidth = size * 0.34;
      ctx.strokeStyle = '#2b1030';
      ctx.strokeText(text, 0, 0);
      ctx.lineWidth = size * 0.22;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeText(text, 0, 0);
    }
    ctx.shadowColor = 'rgba(40, 10, 50, 0.45)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.06;
    ctx.fillStyle = state.captionColor || '#ffffff';
    ctx.fillText(text, 0, 0);
    ctx.restore();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }

  // Sub-caption pill under the title.
  const sub = (state.subcaption || '').trim().toUpperCase();
  if (sub) drawPill(ctx, w / 2, h * 0.76, sub, Math.min(w, h) * 0.032);
}
