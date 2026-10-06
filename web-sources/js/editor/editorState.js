import { dom } from '../dom.js';
import { state, resetLayerHistories } from '../state.js';
import { clearCanvas } from '../utils/misc.js';
import { resetCrop } from '../canvas/crop.js';
import { updateMaskVisualOpacity, updatePaintLayerVisualFilters } from './visualFilters.js';
import { saveActiveLayerState, syncEraserButton } from './layers.js';

/** All canvases making up the editor workspace. */
function editorCanvases() {
  return [dom.bgImageCanvas, dom.paintCanvas, dom.maskCanvas, dom.cropOverlayCanvas];
}

/**
 * Drop everything the editor holds: base image, layers, undo history, crop
 * area and the eraser mode.
 *
 * Clearing the pixels leaves the canvas dimensions intact, which the
 * magnifier, the crop maths and the result redraw all still read.
 *
 * state.lastServerResult is deliberately left alone - it belongs to the
 * result area rather than the editor, and the result stays on screen with
 * its sliders working after a reset.
 */
export function resetEditorState() {
  state.originalImageObject = null;
  state.paddingInfo = null;
  state.lastGenerationHadMask = false;

  editorCanvases().forEach(clearCanvas);

  resetLayerHistories();
  syncEraserButton();
  resetCrop();
  updateMaskVisualOpacity();
  updatePaintLayerVisualFilters();
}

/**
 * Reset the editor and open it on a new base image, starting in mask mode.
 *
 * Canvas dimensions are assigned after the reset, so the empty history
 * snapshots taken below record layers at the final size.
 */
export function loadImageIntoEditor(img) {
  resetEditorState();

  editorCanvases().forEach(c => {
    c.width  = img.width;
    c.height = img.height;
  });

  state.originalImageObject = img;
  dom.bgImageCanvas.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0);

  // Seed undo history for both layers.
  dom.layerModeSelect.value = 'mask';
  saveActiveLayerState();
  dom.layerModeSelect.value = 'paint';
  saveActiveLayerState();
  dom.layerModeSelect.value = 'mask';
  syncEraserButton();

  dom.paintSettingsRow.style.display  = 'none';
  dom.maskSettingsRow.style.display   = 'flex';
  dom.colorPickerGroup.style.display  = 'none';
  dom.maskCanvas.style.display        = 'block';
  dom.maskCanvas.style.pointerEvents  = 'auto';
  dom.paintCanvas.style.pointerEvents = 'none';
  dom.canvasWorkspace.style.display   = 'flex';
  dom.clearImgBtn.style.display       = 'inline-block';
}