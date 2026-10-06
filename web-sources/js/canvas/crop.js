import { dom } from '../dom.js';
import { state } from '../state.js';
import { getCanvasCoordinates, clearCanvas } from '../utils/misc.js';
import { CROP_GRID } from '../config.js';

export function initCrop() {
  dom.cropModeBtn.addEventListener('click', toggleCropMode);
  dom.clearCropBtn.addEventListener('click', resetCrop);
}

function toggleCropMode() {
  state.isCropMode = !state.isCropMode;
  dom.cropModeBtn.classList.toggle('active-crop', state.isCropMode);

  if (state.isCropMode) {
    dom.canvasWrapper.classList.add('crop-hunting');
    // Disable the eraser if it was enabled
    if (state.layerStates[dom.layerModeSelect.value].isEraser) {
      dom.eraserBtn.click();
    }
  } else {
    dom.canvasWrapper.classList.remove('crop-hunting');
  }
}

export function resetCrop() {
  state.activeCropArea = null;
  if (dom.clearCropBtn) dom.clearCropBtn.style.display = 'none';
  if (dom.cropModeBtn)  dom.cropModeBtn.textContent = 'Visible Area';
  if (dom.cropOverlayCanvas && dom.cropOverlayCanvas.width > 0) {
    clearCanvas(dom.cropOverlayCanvas);
  }
}

export function drawSavedCropBorder() {
  const cropCtx = dom.cropOverlayCanvas.getContext('2d', { willReadFrequently: true });
  cropCtx.clearRect(0, 0, dom.cropOverlayCanvas.width, dom.cropOverlayCanvas.height);
  if (!state.activeCropArea) return;

  cropCtx.save();
  cropCtx.strokeStyle = '#00ff00';
  cropCtx.lineWidth = Math.max(2, dom.bgImageCanvas.width / 300);
  cropCtx.setLineDash([6, 4]);
  cropCtx.strokeRect(
    state.activeCropArea.x,
    state.activeCropArea.y,
    state.activeCropArea.width,
    state.activeCropArea.height
  );
  cropCtx.restore();
}

/** Handle the start of a selection (called from drawing.js). */
export function startCrop(e, canvas) {
  state.isCropping = true;
  state.cropStart = { ...getCanvasCoordinates(e, canvas) };
  state.cropEnd   = { ...state.cropStart };
}

/** Handles the selection process. */
export function updateCrop(e, canvas) {
  state.cropEnd = { ...getCanvasCoordinates(e, canvas) };
  const cropCtx = dom.cropOverlayCanvas.getContext('2d', { willReadFrequently: true });
  cropCtx.clearRect(0, 0, dom.cropOverlayCanvas.width, dom.cropOverlayCanvas.height);
  cropCtx.save();
  cropCtx.strokeStyle = '#00ff00';
  cropCtx.lineWidth = 3;
  cropCtx.strokeRect(
    state.cropStart.x, state.cropStart.y,
    state.cropEnd.x - state.cropStart.x,
    state.cropEnd.y - state.cropStart.y
  );
  cropCtx.restore();
}

/** Finalize crop on mouseup. */
export function finalizeCrop() {
  if (!state.isCropMode || !state.isCropping) return;
  state.isCropping = false;

  let x = Math.min(state.cropStart.x, state.cropEnd.x);
  let y = Math.min(state.cropStart.y, state.cropEnd.y);
  let width  = Math.abs(state.cropEnd.x - state.cropStart.x);
  let height = Math.abs(state.cropEnd.y - state.cropStart.y);

  if (width > 10 && height > 10) {
    // Align to 8 pixel grid
    x = Math.floor(x / CROP_GRID) * CROP_GRID;
    y = Math.floor(y / CROP_GRID) * CROP_GRID;
    width  = Math.ceil(width  / CROP_GRID) * CROP_GRID;
    height = Math.ceil(height / CROP_GRID) * CROP_GRID;

    if (x + width  > dom.bgImageCanvas.width)  width  = dom.bgImageCanvas.width  - x;
    if (y + height > dom.bgImageCanvas.height) height = dom.bgImageCanvas.height - y;

    state.activeCropArea = { x, y, width, height };
    dom.clearCropBtn.style.display = 'inline-block';
    dom.cropModeBtn.textContent = 'Visible Area: Active';
    drawSavedCropBorder();
    dom.cropModeBtn.click(); // turn off the mode
  } else {
    clearCanvas(dom.cropOverlayCanvas);
  }
}

/** Forced redrawing of base layers and Crop frame. */
export function redrawAllCanvases() {
  if (!state.originalImageObject) return;
  const ctx = dom.bgImageCanvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, dom.bgImageCanvas.width, dom.bgImageCanvas.height);
  ctx.drawImage(state.originalImageObject, 0, 0);
  drawSavedCropBorder();
}
