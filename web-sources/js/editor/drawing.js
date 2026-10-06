import { dom } from '../dom.js';
import { state } from '../state.js';
import { getCanvasCoordinates, getStrokePoints } from '../utils/misc.js';
import { saveActiveLayerState } from './layers.js';
import { startCrop, updateCrop, finalizeCrop } from '../canvas/crop.js';
import { hideCursorOverlays } from '../canvas/magnifier.js';

/**
 * Strokes are driven by pointer events so a finger, a stylus and a mouse all
 * share one code path. The canvases set `touch-action: none` in CSS, otherwise
 * the browser turns a drag into a page scroll and the stroke stops at once.
 */
export function startDrawingFlow(e, c) {
  if (!claimStroke(e, c)) return;

  // Crop selection is not a painting stroke: it must not push an undo entry.
  if (state.isCropMode) {
    startCrop(e, c);
    return;
  }

  state.isDrawing = true;
  const coords = getCanvasCoordinates(e, c);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.beginPath();
  ctx.moveTo(coords.x, coords.y);
  drawFlow(e, c);
}

export function drawFlow(e, c) {
  if (state.activePointerId !== e.pointerId) return;

  if (state.isCropMode && state.isCropping) {
    updateCrop(e, c);
    return;
  }
  if (!state.isDrawing) return;

  const mode = dom.layerModeSelect.value;
  const ctx = c.getContext('2d', { willReadFrequently: true });

  ctx.lineWidth = parseInt(dom.brushSizeInput.value);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (state.layerStates[mode].isEraser) {
    ctx.globalCompositeOperation = 'destination-out';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = (mode === 'mask') ? '#ff007f' : dom.brushColorInput.value;
  }

  // Touch hardware batches several positions per frame. Drawing all of them
  // keeps a fast finger stroke smooth instead of a chain of straight lines.
  for (const point of getStrokePoints(e, c)) {
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }
}

/**
 * Takes ownership of the interaction for one pointer and pins it to the
 * canvas, so the gesture keeps going even when the finger slides past the
 * canvas edge. Returns false when another pointer already owns it, which is
 * what keeps a second finger or a resting palm from starting a second stroke.
 */
function claimStroke(e, c) {
  if (state.activePointerId !== null) return false;
  if (e.isPrimary === false) return false;
  // Mouse only: ignore right and middle buttons. Touch reports button 0 on down.
  if (e.pointerType === 'mouse' && e.button !== 0) return false;

  e.preventDefault();
  state.activePointerId = e.pointerId;
  c.setPointerCapture(e.pointerId);
  return true;
}

/**
 * Stroke end. Listening on the window means releasing outside the canvas still
 * finalizes the layer history and the crop rectangle, and `pointercancel`
 * covers a gesture interrupted by the system (call, notification, palm).
 */
export function initStrokeEnd() {
  const onRelease = (e) => {
    const wasDrawing = releasePointer(e);
    if (wasDrawing === null) return;

    if (wasDrawing) saveActiveLayerState();
    finalizeCrop();

    // A mouse keeps hovering, a finger does not: drop the ring and the loupe.
    if (e.pointerType !== 'mouse') hideCursorOverlays();
  };

  // A lost window can swallow the release altogether, which would leave the
  // canvas locked to a pointer that never reports back.
  const onWindowBlur = () => {
    if (releasePointer(null)) saveActiveLayerState();
  };

  window.addEventListener('pointerup', onRelease);
  window.addEventListener('pointercancel', onRelease);
  window.addEventListener('blur', onWindowBlur);
}

/**
 * Frees the pointer lock. Returns whether a stroke was in progress, or null
 * when the caller did not own the stroke - a stray release elsewhere on the
 * page must not finalize an unrelated action.
 *
 * @param {{ pointerId: number } | null} e
 * @returns {boolean | null}
 */
function releasePointer(e) {
  if (state.activePointerId === null) return null;
  if (e && e.pointerId !== state.activePointerId) return null;

  state.activePointerId = null;
  const wasDrawing = state.isDrawing;
  state.isDrawing = false;
  return wasDrawing;
}
