import { dom, magnifier } from '../dom.js';
import { state } from '../state.js';
import {
  MAGNIFIER_SIZE,
  MAGNIFIER_ZOOM,
  BRUSH_RING_COLOR,
  BRUSH_RING_SHADOW,
} from '../config.js';

/** Gap between the finger and the loupe, so the hand does not cover it. */
const TOUCH_LIFT = 28;

export function initMagnifier() {
  if (dom.canvasWrapper) {
    // Pointer events, because the loupe has to follow a finger as well: touch
    // has no hover state to rely on.
    dom.canvasWrapper.addEventListener('pointerdown', updateMagnifierAndCursor);
    dom.canvasWrapper.addEventListener('pointermove', updateMagnifierAndCursor);
    dom.canvasWrapper.addEventListener('pointerleave', hideCursorOverlays);
    dom.canvasWrapper.addEventListener('pointercancel', hideCursorOverlays);
    dom.canvasWrapper.addEventListener('pointerenter', updateBrushCursorSize);
  }
  if (dom.magnifierCheckbox) {
    dom.magnifierCheckbox.addEventListener('change', () => {
      if (dom.magnifierCheckbox.checked) return;
      magnifier.style.display = 'none';
      // The loupe was hiding the DOM ring. Put it back at the last known spot
      // right away - the next pointermove would be a frame too late.
      dom.brushCursor.style.display = 'block';
    });
  }
  // The canvas is scaled by CSS, so the ring has to be re-measured whenever the
  // viewport changes - notably on device rotation.
  window.addEventListener('resize', updateBrushCursorSize);
}

/** Hides both overlays. Touch has no hover, so nothing brings them back. */
export function hideCursorOverlays() {
  dom.brushCursor.style.display = 'none';
  magnifier.style.display = 'none';
}

export function updateBrushCursorSize() {
  const size = parseInt(dom.brushSizeInput.value);
  const rect = dom.bgImageCanvas.getBoundingClientRect();
  const scale = rect.width / dom.bgImageCanvas.width;
  const displaySize = size * scale;
  dom.brushCursor.style.width  = `${displaySize}px`;
  dom.brushCursor.style.height = `${displaySize}px`;
}

function updateMagnifierAndCursor(e) {
  const rect = dom.bgImageCanvas.getBoundingClientRect();
  const posX = e.clientX - rect.left;
  const posY = e.clientY - rect.top;
  const isInside = posX >= 0 && posX <= rect.width && posY >= 0 && posY <= rect.height;

  if (state.isCropMode || !isInside) {
    hideCursorOverlays();
    return;
  }

  const useLoupe = dom.magnifierCheckbox?.checked && state.originalImageObject;

  // The loupe paints its own ring, magnified together with the pixels, so the
  // DOM one is hidden while it is on - otherwise two circles of different sizes
  // would overlap on the same spot.
  dom.brushCursor.style.display = useLoupe ? 'none' : 'block';
  dom.brushCursor.style.left = `${posX}px`;
  dom.brushCursor.style.top  = `${posY}px`;

  if (!useLoupe) {
    magnifier.style.display = 'none';
    return;
  }

  magnifier.style.display = 'block';
  const spot = loupeSpot(e, posX, posY, rect);
  magnifier.style.left = `${spot.left}px`;
  magnifier.style.top  = `${spot.top}px`;

  const mCtx = magnifier.getContext('2d', { willReadFrequently: true });
  mCtx.clearRect(0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE);

  const scaleX = dom.bgImageCanvas.width  / rect.width;
  const scaleY = dom.bgImageCanvas.height / rect.height;

  const canvasX = posX * scaleX;
  const canvasY = posY * scaleY;

  const sourceW = (MAGNIFIER_SIZE / MAGNIFIER_ZOOM) * scaleX;
  const sourceH = (MAGNIFIER_SIZE / MAGNIFIER_ZOOM) * scaleY;
  const sourceX = canvasX - sourceW / 2;
  const sourceY = canvasY - sourceH / 2;

  mCtx.save();
  mCtx.beginPath();
  mCtx.arc(MAGNIFIER_SIZE / 2, MAGNIFIER_SIZE / 2, MAGNIFIER_SIZE / 2, 0, Math.PI * 2);
  mCtx.clip();

  mCtx.drawImage(
    dom.bgImageCanvas,
    sourceX, sourceY, sourceW, sourceH,
    0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE
  );

  if (dom.paintCanvas.style.display !== 'none') {
    mCtx.save();
    mCtx.globalAlpha = parseFloat(dom.layerOpacityInput.value);
    const blur = parseInt(dom.layerBlurInput.value);
    if (blur > 0) mCtx.filter = `blur(${blur}px)`;
    mCtx.drawImage(
      dom.paintCanvas,
      sourceX, sourceY, sourceW, sourceH,
      0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE
    );
    mCtx.restore();
  }

  if (dom.maskCanvas.style.display !== 'none') {
    mCtx.save();
    mCtx.globalAlpha = parseFloat(dom.maskOpacityInput.value);
    mCtx.drawImage(
      dom.maskCanvas,
      sourceX, sourceY, sourceW, sourceH,
      0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE
    );
    mCtx.restore();
  }

  drawBrushRing(mCtx, sourceW);

  mCtx.restore();
}

/**
 * Brush ring, drawn into the loupe instead of the DOM cursor above it.
 *
 * The loupe bitmap is shown 1:1, so the ring has to grow by the same factor
 * the pixels do. `sourceW` source pixels are stretched across the whole
 * bitmap, hence radius = brushSize / 2 * (size / sourceW). The ring is clipped
 * to the glass, which is what keeps a wide brush from drawing a circle across
 * the whole image.
 */
function drawBrushRing(mCtx, sourceW) {
  const radius = (parseInt(dom.brushSizeInput.value) / 2) * (MAGNIFIER_SIZE / sourceW);
  const center = MAGNIFIER_SIZE / 2;

  mCtx.beginPath();
  mCtx.arc(center, center, radius, 0, Math.PI * 2);
  // A dark pass under the bright one mirrors the box-shadow of .brush-cursor:
  // the ring stays readable over both light and dark pixels.
  mCtx.strokeStyle = BRUSH_RING_SHADOW;
  mCtx.lineWidth = 3;
  mCtx.stroke();
  mCtx.strokeStyle = BRUSH_RING_COLOR;
  mCtx.lineWidth = 1;
  mCtx.stroke();
}

/**
 * Loupe position inside the canvas wrapper. A finger is parked above the
 * touch point so the tip stays visible, and the result is clamped so the loupe
 * never hangs outside the image.
 */
function loupeSpot(e, posX, posY, rect) {
  const centeredY = posY - MAGNIFIER_SIZE / 2;
  const top = e.pointerType === 'touch' ? posY - MAGNIFIER_SIZE - TOUCH_LIFT : centeredY;

  return {
    left: clamp(posX - MAGNIFIER_SIZE / 2, 0, Math.max(0, rect.width  - MAGNIFIER_SIZE)),
    top:  clamp(top, 0, Math.max(0, rect.height - MAGNIFIER_SIZE)),
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}
