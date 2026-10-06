import { dom } from '../dom.js';
import { state } from '../state.js';
import { makeCanvasSquare } from './squareUtils.js';

/** B/W shape mask (white on black), reduced to a square (for the server). */
export function buildInpaintBlackWhiteMaskCanvas() {
  if (!dom.maskCanvas || dom.maskCanvas.width === 0) return null;
  const maskCtx = dom.maskCanvas.getContext('2d', { willReadFrequently: true });
  const data = maskCtx.getImageData(0, 0, dom.maskCanvas.width, dom.maskCanvas.height).data;

  let hasMask = false;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 10) { hasMask = true; break; }
  }
  if (!hasMask) return null;

  const fullMaskCanvas = document.createElement('canvas');
  fullMaskCanvas.width  = dom.maskCanvas.width;
  fullMaskCanvas.height = dom.maskCanvas.height;
  const fullMaskCtx = fullMaskCanvas.getContext('2d', { willReadFrequently: true });
  fullMaskCtx.fillStyle = '#000000';
  fullMaskCtx.fillRect(0, 0, fullMaskCanvas.width, fullMaskCanvas.height);

  const finalData = fullMaskCtx.getImageData(0, 0, fullMaskCanvas.width, fullMaskCanvas.height);
  const d = finalData.data;
  for (let i = 0; i < d.length; i += 4) {
    if (data[i + 3] > 10) {
      d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; d[i + 3] = 255;
    }
  }
  fullMaskCtx.putImageData(finalData, 0, 0);

  let canvasToSquare = fullMaskCanvas;
  if (state.activeCropArea) {
    const cropMaskCanvas = document.createElement('canvas');
    cropMaskCanvas.width  = state.activeCropArea.width;
    cropMaskCanvas.height = state.activeCropArea.height;
    const cropMaskCtx = cropMaskCanvas.getContext('2d', { willReadFrequently: true });
    cropMaskCtx.drawImage(
      fullMaskCanvas,
      state.activeCropArea.x, state.activeCropArea.y,
      state.activeCropArea.width, state.activeCropArea.height,
      0, 0, state.activeCropArea.width, state.activeCropArea.height
    );
    canvasToSquare = cropMaskCanvas;
  }

  return makeCanvasSquare(canvasToSquare, true);
}

/** Base64 version of the black-and-white mask for sending to the server. */
export function generateInpaintBlackWhiteMaskBase64() {
  const result = buildInpaintBlackWhiteMaskCanvas();
  if (!result) return null;
  return result.canvas.toDataURL('image/png').split(',');
}

/** B/W shape mask at full bgImageCanvas resolution (without the square and crop). */
export function buildInpaintMaskFullSize() {
  if (!dom.maskCanvas || dom.maskCanvas.width === 0) return null;
  const maskCtx = dom.maskCanvas.getContext('2d', { willReadFrequently: true });
  const data = maskCtx.getImageData(0, 0, dom.maskCanvas.width, dom.maskCanvas.height).data;

  let hasMask = false;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 10) { hasMask = true; break; }
  }
  if (!hasMask) return null;

  const out = document.createElement('canvas');
  out.width  = dom.maskCanvas.width;
  out.height = dom.maskCanvas.height;
  const octx = out.getContext('2d', { willReadFrequently: true });
  octx.clearRect(0, 0, out.width, out.height);

  const imgData = octx.getImageData(0, 0, out.width, out.height);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    if (data[i + 3] > 10) {
      d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; d[i + 3] = 255;
    } else {
      d[i] = 0; d[i + 1] = 0; d[i + 2] = 0; d[i + 3] = 0;
    }
  }
  octx.putImageData(imgData, 0, 0);
  return out;
}

/** Full-size B/W shape mask for bgImageCanvas (white on black). */
export function buildInpaintBlackWhiteMaskCanvasFullSize() {
  if (!dom.maskCanvas || dom.maskCanvas.width === 0) return null;
  const maskCtx = dom.maskCanvas.getContext('2d', { willReadFrequently: true });
  const data = maskCtx.getImageData(0, 0, dom.maskCanvas.width, dom.maskCanvas.height).data;

  let hasMask = false;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 10) { hasMask = true; break; }
  }
  if (!hasMask) return null;

  const fullMaskCanvas = document.createElement('canvas');
  fullMaskCanvas.width  = dom.maskCanvas.width;
  fullMaskCanvas.height = dom.maskCanvas.height;
  const fullMaskCtx = fullMaskCanvas.getContext('2d', { willReadFrequently: true });
  fullMaskCtx.fillStyle = '#000';
  fullMaskCtx.fillRect(0, 0, fullMaskCanvas.width, fullMaskCanvas.height);

  const finalData = fullMaskCtx.getImageData(0, 0, fullMaskCanvas.width, fullMaskCanvas.height);
  const d = finalData.data;
  for (let i = 0; i < d.length; i += 4) {
    if (data[i + 3] > 10) {
      d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; d[i + 3] = 255;
    }
  }
  fullMaskCtx.putImageData(finalData, 0, 0);
  return fullMaskCanvas;
}

/** Dilation + mask blur (feathered). */
export function buildFeatheredMaskFullSize(expandPx = 10, blurPx = 10) {
  const bw = buildInpaintMaskFullSize();
  if (!bw) return null;

  const w = bw.width, h = bw.height;

  // Dilation
  const expanded = document.createElement('canvas');
  expanded.width = w; expanded.height = h;
  const expCtx = expanded.getContext('2d', { willReadFrequently: true });
  expCtx.clearRect(0, 0, w, h);

  if (expandPx > 0) {
    for (let dy = -expandPx; dy <= expandPx; dy++) {
      for (let dx = -expandPx; dx <= expandPx; dx++) {
        if (dx * dx + dy * dy > expandPx * expandPx) continue;
        expCtx.drawImage(bw, dx, dy);
      }
    }
  } else {
    expCtx.drawImage(bw, 0, 0);
  }

  // Blur
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const octx = out.getContext('2d', { willReadFrequently: true });
  if (blurPx > 0) {
    octx.filter = `blur(${blurPx}px)`;
  }
  octx.drawImage(expanded, 0, 0);
  octx.filter = 'none';
  return out;
}
