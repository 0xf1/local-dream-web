import { dom } from '../dom.js';
import { state } from '../state.js';
import { DEBUG_W, DEBUG_H } from '../config.js';

export function initDebug() {
  dom.showDebugCheckbox.addEventListener('change', applyDebugVisibility);
}

function applyDefaultDebugPosition(el, kind) {
  if (el.dataset.positioned === '1') return;
  const offset = state.debugOffsets[kind] * (DEBUG_W + 20);
  el.style.left = (window.innerWidth  - DEBUG_W - 10 - offset) + 'px';
  el.style.top  = (window.innerHeight - DEBUG_H - 10) + 'px';
  el.dataset.positioned = '1';
}

/**
 * Dragging uses pointer events and pointer capture, the same approach as the
 * notes widget, so a debug canvas can be moved with a finger as well. Capture
 * keeps the move and release events on the element itself, which removes the
 * need for document level listeners.
 */
function makeDraggable(el) {
  let activePointerId = null;
  let startX = 0, startY = 0;
  let startLeft = 0, startTop = 0;

  el.style.cursor = 'move';
  el.style.userSelect = 'none';
  // Without this a drag is treated as a page scroll and never arrives.
  el.style.touchAction = 'none';

  el.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    activePointerId = e.pointerId;
    el.setPointerCapture(activePointerId);

    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseInt(el.style.left, 10) || 0;
    startTop  = parseInt(el.style.top, 10) || 0;
    el.style.zIndex = '100000';
  });

  el.addEventListener('pointermove', (e) => {
    if (activePointerId !== e.pointerId) return;

    const newLeft = clamp(startLeft + e.clientX - startX, 0, window.innerWidth  - el.offsetWidth);
    const newTop  = clamp(startTop  + e.clientY - startY,  0, window.innerHeight - el.offsetHeight);
    el.style.left = newLeft + 'px';
    el.style.top  = newTop  + 'px';

    const label = document.getElementById(el.id + '_label');
    if (label) {
      label.style.left = newLeft + 'px';
      label.style.top  = (newTop - 16) + 'px';
    }
  });

  const endDrag = (e) => {
    if (activePointerId !== e.pointerId) return;
    if (el.hasPointerCapture(activePointerId)) el.releasePointerCapture(activePointerId);
    activePointerId = null;
    el.style.zIndex = '99999';
  };

  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function ensureDebugCanvas(id, kind, borderColor, labelColor, w, h) {
  let dbg = (/** @type {HTMLCanvasElement} */ (document.getElementById('debug_' + id)));
  if (dbg) return dbg;

  const visible = dom.showDebugCheckbox.checked;

  dbg = document.createElement('canvas');
  dbg.id = 'debug_' + id;
  dbg.width = w;
  dbg.height = h;
  dbg.style.position = 'fixed';
  dbg.style.border = '2px solid ' + borderColor;
  dbg.style.background = '#000';
  dbg.style.zIndex = '99999';
  dbg.style.display = visible ? 'block' : 'none';
  document.body.appendChild(dbg);

  applyDefaultDebugPosition(dbg, kind);
  makeDraggable(dbg);

  const label = document.createElement('div');
  label.id = 'debug_' + id + '_label';
  label.textContent = id;
  label.style.position = 'fixed';
  label.style.color = labelColor;
  label.style.font = 'bold 12px monospace';
  label.style.zIndex = '99999';
  label.style.pointerEvents = 'none';
  label.style.userSelect = 'none';
  label.style.left = dbg.style.left;
  label.style.top = (parseInt(dbg.style.top, 10) - 16) + 'px';
  label.style.display = visible ? 'block' : 'none';
  document.body.appendChild(label);

  state.debugOffsets[kind]++;
  return dbg;
}

export function debugShowCanvas(sourceCanvas, id, w = DEBUG_W, h = DEBUG_H) {
  const dbg = ensureDebugCanvas(id, 'canvas', 'red', 'red', w, h);
  const dctx = dbg.getContext('2d', { willReadFrequently: true });
  dctx.fillStyle = '#000';
  dctx.fillRect(0, 0, w, h);
  dctx.drawImage(sourceCanvas, 0, 0, w, h);
}

export function debugShowCropRegion(sourceCanvas, id, w = 200, h = 200) {
  if (!sourceCanvas) return;
  let sx = 0, sy = 0, sw = sourceCanvas.width, sh = sourceCanvas.height;
  if (state.activeCropArea) {
    sx = state.activeCropArea.x;
    sy = state.activeCropArea.y;
    sw = state.activeCropArea.width;
    sh = state.activeCropArea.height;
  }

  const cut = document.createElement('canvas');
  cut.width = w; cut.height = h;
  const cctx = cut.getContext('2d', { willReadFrequently: true });
  cctx.fillStyle = '#000';
  cctx.fillRect(0, 0, w, h);

  // 1. Find the scaling factors for width and height
  const ratioX = w / sw;
  const ratioY = h / sh;
  // Pick the smaller factor so that the picture fits entirely
  const scale = Math.min(ratioX, ratioY);

  // 2. Calculate new dimensions while maintaining the aspect ratio
  const dw = sw * scale;
  const dh = sh * scale;

  // 3. Center the image on the new canvas
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;

  // 4. Draw with the correct coordinates and dimensions
  cctx.drawImage(sourceCanvas, sx, sy, sw, sh, dx, dy, dw, dh);

  debugShowCanvas(cut, id, w, h);
}

export function debugShowBase64(base64Str, id, w = DEBUG_W, h = DEBUG_H) {
  if (!base64Str) {
    console.warn('debugShowBase64: empty string for', id);
    return;
  }
  const img = new Image();
  img.onload = () => {
    const dbg = ensureDebugCanvas(id, 'base64', 'lime', 'lime', w, h);
    const dctx = dbg.getContext('2d', { willReadFrequently: true });
    dctx.fillStyle = '#000';
    dctx.fillRect(0, 0, w, h);
    dctx.drawImage(img, 0, 0, w, h);
  };
  img.src = 'data:image/png;base64,' + base64Str;
}

export function applyDebugVisibility() {
  const visible = dom.showDebugCheckbox.checked;
  document.querySelectorAll('[id^="debug_"]').forEach( (/** @type {HTMLElement} */ el) => {
    el.style.display = visible ? 'block' : 'none';
  });
}
