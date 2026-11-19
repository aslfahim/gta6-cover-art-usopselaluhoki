// Beach Heist editor: photo upload (file input and drag-drop), per-band crop and
// position (drag to pan, zoom slider), caption editing, and PNG export in three
// post sizes. A `?shot=` query sets up a fixed scene for a screenshot (./shots.js).
import { drawCover, SIZES, BANDS } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const status = $('status');

const state = {
  size: 'square',
  bands: BANDS.map(() => ({ photo: null, zoom: 1, ox: 0, oy: 0 })),
  caption: 'BEACH HEIST',
  captionSize: 1,
  captionColor: '#ffffff',
  captionOutline: true,
  subcaption: 'SUMMER 2026',
  badges: true,
  selected: 0,
};

function applySize() {
  const s = SIZES[state.size];
  canvas.width = s.w;
  canvas.height = s.h;
}

function redraw() {
  applySize();
  drawCover(canvas, state);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Loads an image from a local file the user picked or dropped. */
function loadFile(file) {
  return loadImage(URL.createObjectURL(file));
}

function setBandPhoto(index, img) {
  state.bands[index].photo = img;
  state.bands[index].zoom = 1;
  state.bands[index].ox = 0;
  state.bands[index].oy = 0;
  redraw();
}

async function handleFiles(files, index) {
  const file = files && files[0];
  if (!file || !file.type.startsWith('image/')) return;
  try {
    setBandPhoto(index, await loadFile(file));
    status.textContent = `Photo loaded into the ${BANDS[index].name} band.`;
  } catch {
    status.textContent = 'That file could not be read as a photo.';
  }
}

// --- Band selection and per-band controls ---------------------------------
const bandButtons = [...document.querySelectorAll('[data-band]')];
const zoom = $('zoom');
const zoomValue = $('zoomValue');

function selectBand(index) {
  state.selected = index;
  bandButtons.forEach((b) => b.classList.toggle('active', Number(b.dataset.band) === index));
  zoom.value = state.bands[index].zoom;
  zoomValue.textContent = `${Number(state.bands[index].zoom).toFixed(2)}x`;
  $('bandName').textContent = BANDS[index].name;
  $('bandName2').textContent = BANDS[index].name;
}
bandButtons.forEach((b) => b.addEventListener('click', () => selectBand(Number(b.dataset.band))));

document.querySelectorAll('.band-photo').forEach((input) => {
  input.addEventListener('change', (e) => handleFiles(e.target.files, Number(input.dataset.band)));
});

$('fillAll').addEventListener('click', () => {
  const src = state.bands[state.selected].photo;
  if (!src) { status.textContent = 'Load a photo into the selected band first.'; return; }
  state.bands.forEach((band, i) => {
    if (i !== state.selected) {
      band.photo = src;
      band.zoom = state.bands[state.selected].zoom;
      band.ox = state.bands[state.selected].ox;
      band.oy = state.bands[state.selected].oy;
    }
  });
  redraw();
  status.textContent = 'One photo now fills all three bands.';
});

zoom.addEventListener('input', () => {
  state.bands[state.selected].zoom = Number(zoom.value);
  zoomValue.textContent = `${Number(zoom.value).toFixed(2)}x`;
  redraw();
});

$('resetCrop').addEventListener('click', () => {
  const band = state.bands[state.selected];
  band.zoom = 1; band.ox = 0; band.oy = 0;
  zoom.value = 1;
  zoomValue.textContent = '1.00x';
  redraw();
});

// --- Drag to pan the selected band on the preview, click to pick a band -----
let dragging = null;
function bandAt(clientY) {
  const rect = canvas.getBoundingClientRect();
  const y = (clientY - rect.top) / rect.height;
  let acc = 0;
  for (let i = 0; i < BANDS.length; i++) {
    acc += BANDS[i].frac;
    if (y <= acc || i === BANDS.length - 1) return i;
  }
  return 0;
}
canvas.addEventListener('pointerdown', (e) => {
  const index = bandAt(e.clientY);
  selectBand(index);
  dragging = { x: e.clientX, y: e.clientY, index };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const band = state.bands[dragging.index];
  band.ox += (e.clientX - dragging.x) / rect.width;
  band.oy += (e.clientY - dragging.y) / rect.height;
  dragging.x = e.clientX;
  dragging.y = e.clientY;
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });

// --- Drag-drop a photo straight onto a band --------------------------------
canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  handleFiles(e.dataTransfer.files, bandAt(e.clientY));
});

// --- Caption controls -------------------------------------------------------
$('caption').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
$('captionSize').addEventListener('input', (e) => {
  state.captionSize = Number(e.target.value);
  $('captionSizeValue').textContent = `${Math.round(state.captionSize * 100)}%`;
  redraw();
});
$('captionColor').addEventListener('input', (e) => { state.captionColor = e.target.value; redraw(); });
$('captionOutline').addEventListener('change', (e) => { state.captionOutline = e.target.checked; redraw(); });
$('subcaption').addEventListener('input', (e) => { state.subcaption = e.target.value; redraw(); });
$('badges').addEventListener('change', (e) => { state.badges = e.target.checked; redraw(); });

// --- Export size and PNG export --------------------------------------------
document.querySelectorAll('[data-size]').forEach((b) => {
  b.addEventListener('click', () => {
    state.size = b.dataset.size;
    document.querySelectorAll('[data-size]').forEach((x) => x.classList.toggle('active', x === b));
    redraw();
  });
});

$('export').addEventListener('click', () => {
  const s = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = s.w;
  off.height = s.h;
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed in this browser.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `beach-heist-${s.w}x${s.h}.png`;
    a.click();
    status.textContent = `Saved beach-heist-${s.w}x${s.h}.png`;
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
});

// --- Screenshot scenes -------------------------------------------------------
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, async (scene) => {
    if (scene.size) {
      state.size = scene.size;
      document.querySelectorAll('[data-size]').forEach((x) => x.classList.toggle('active', x.dataset.size === scene.size));
    }
    if (scene.caption !== undefined) {
      state.caption = scene.caption;
      $('caption').value = scene.caption;
    }
    if (scene.subcaption !== undefined) {
      state.subcaption = scene.subcaption;
      $('subcaption').value = scene.subcaption;
    }
    if (scene.photo) {
      const img = await loadImage(scene.photo);
      // The pier shot fills every band; each band gets its own crop so the
      // three bands do not look like one flat photo.
      state.bands.forEach((band, i) => {
        band.photo = img;
        band.zoom = 1.15 + i * 0.25;
        band.ox = (i - 1) * 0.06;
        band.oy = (i - 1) * 0.04;
      });
    }
    redraw();
  });
} else {
  selectBand(0);
  redraw();
}
