import { dom } from '../dom.js';
import { state } from '../state.js';
import { clearCanvas, setSliderValue } from '../utils/misc.js';
import { resetCrop, drawSavedCropBorder } from '../canvas/crop.js';
import { updateMaskVisualOpacity, updatePaintLayerVisualFilters } from '../editor/visualFilters.js';
import { syncEraserButton } from '../editor/layers.js';
import { updateBrushCursorSize } from '../canvas/magnifier.js';
import { onLoadModel } from '../generation/models.js';
import { updateSizeText } from '../ui/sizeControls.js';
import { FILE_VERSION } from './sessionSerializer.js';
import { loadImage, dataUrlToImageData } from './imageIoUtils.js';

/* ============================================================
   Deserialization
   ============================================================ */
export async function restoreSessionFromSnapshot(snapshot) {
  if (!snapshot || snapshot.version !== FILE_VERSION) {
    throw new Error('Unsupported session version');
  }

  await restoreModelAndPrompt(snapshot);

  if (snapshot.img2img) {
    await restoreImg2Img(snapshot.img2img);
  }
}

async function restoreModelAndPrompt(snapshot) {
  if (snapshot.modelId) {
    if (dom.modelSelect.value !== snapshot.modelId) {
      dom.modelSelect.value = snapshot.modelId;
      await onLoadModel();
    }
  }

  if (snapshot.denoiseStrength) {
    setSliderValue(dom.generation.denoiseStrength, snapshot.denoiseStregth);
  }

  if (snapshot.prompt) {
    dom.promptInput.value = snapshot.prompt;
  }

  if (snapshot.negativePrompt) {
    dom.negativePromptInput.value = snapshot.negativePrompt;
  }

  if (snapshot.advancedGenerationParams) {
    setSliderValue(dom.generation.cfg, snapshot.advancedGenerationParams.cfg);
    dom.generation.karras.checked = snapshot.advancedGenerationParams.karras;
    dom.generation.sampler.value =  snapshot.advancedGenerationParams.sampler;
    dom.generation.seed.value =  snapshot.advancedGenerationParams.seed;
    dom.generation.widthSlider.value = snapshot.advancedGenerationParams.width;
    dom.generation.heightSlider.value = snapshot.advancedGenerationParams.height;
    updateSizeText();
    setSliderValue(dom.generation.steps , snapshot.advancedGenerationParams.steps);
  }
}

async function restoreImg2Img(img2img) {
  if (!img2img.original?.dataUrl) {
    throw new Error('Snapshot has no original image');
  }

  // 1) Original
  const originalImg = await loadImage(img2img.original.dataUrl);
  state.originalImageObject = originalImg;

  // 2) Canvas dimensions
  const w = originalImg.width;
  const h = originalImg.height;
  [dom.bgImageCanvas, dom.paintCanvas, dom.maskCanvas, dom.cropOverlayCanvas]
    .forEach(c => { c.width = w; c.height = h; });

  // 3) Original
  dom.bgImageCanvas.getContext('2d', { willReadFrequently: true }).drawImage(originalImg, 0, 0);

  // 4) Mask and drawing
  clearCanvas(dom.maskCanvas);
  clearCanvas(dom.paintCanvas);
  if (img2img.mask?.dataUrl) {
    const maskImg = await loadImage(img2img.mask.dataUrl);
    dom.maskCanvas.getContext('2d', { willReadFrequently: true }).drawImage(maskImg, 0, 0);
  }
  if (img2img.paint?.dataUrl) {
    const paintImg = await loadImage(img2img.paint.dataUrl);
    dom.paintCanvas.getContext('2d', { willReadFrequently: true }).drawImage(paintImg, 0, 0);
  }

  // 5) Crop
  restoreCrop(img2img);

  // 6) UI settings
  restoreUiSettings(img2img.ui || {});

  // 7) Workspace
  dom.canvasWorkspace.style.display = 'flex';
  dom.clearImgBtn.style.display = 'inline-block';

  // 8) History — IMPORTANT: before saving the "snapshot," otherwise it will be overwritten
  await deserializeLayerHistory('mask',  img2img.history?.mask);
  await deserializeLayerHistory('paint', img2img.history?.paint);

  // 9) If there is no history (old file or empty) — create an initial snapshot,
  //    so that Undo doesn't lead into a void.
  ensureInitialHistorySnapshot();

  setTimeout(updateBrushCursorSize, 50);
}

function restoreCrop(img2img) {
  state.activeCropArea = img2img.crop ? { ...img2img.crop } : null;
  state.paddingInfo    = img2img.paddingInfo ? { ...img2img.paddingInfo } : null;
  if (state.activeCropArea) {
    dom.clearCropBtn.style.display = 'inline-block';
    dom.cropModeBtn.textContent = 'Visible Area: Active';
    drawSavedCropBorder();
  } else {
    resetCrop();
  }
}

function restoreUiSettings(ui) {
  if (ui.layerMode) dom.layerModeSelect.value = ui.layerMode;
  dom.layerModeSelect.dispatchEvent(new Event('change'));

  state.layerStates.mask.isEraser  = !!ui.isEraser?.mask;
  state.layerStates.paint.isEraser = !!ui.isEraser?.paint;
  syncEraserButton();

  if (ui.brushColor)   dom.brushColorInput.value   = ui.brushColor;
  if (ui.brushSize)    dom.brushSizeInput.value    = ui.brushSize;
  if (ui.layerOpacity) dom.layerOpacityInput.value = ui.layerOpacity;
  if (ui.layerBlur)    dom.layerBlurInput.value    = ui.layerBlur;
  if (ui.maskOpacity)  dom.maskOpacityInput.value  = ui.maskOpacity;
  if (ui.maskFeather)  dom.maskFeatherInput.value  = ui.maskFeather;
  if (ui.maskBlend)    dom.maskBlendInput.value    = ui.maskBlend;
  if (ui.maskBlur)     dom.maskBlurInput.value     = ui.maskBlur;

  updateMaskVisualOpacity();
  updatePaintLayerVisualFilters();
  dom.maskFeatherVal.textContent = dom.maskFeatherInput.value;
  dom.maskBlendVal.textContent   = dom.maskBlendInput.value;
  dom.maskBlurVal.textContent    = dom.maskBlurInput.value;
}

function ensureInitialHistorySnapshot() {
  ['mask', 'paint'].forEach(mode => {
    const h = state.layerStates[mode];
    if (h.undoHistory.length === 0) {
      const c = (mode === 'mask') ? dom.maskCanvas : dom.paintCanvas;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      h.undoHistory.push(ctx.getImageData(0, 0, c.width, c.height));
    }
  });
}

async function deserializeLayerHistory(mode, historyData) {
  const layer = state.layerStates[mode];
  layer.undoHistory = [];
  layer.redoHistory = [];

  if (!historyData) return;

  for (const dataUrl of (historyData.undo || [])) {
    layer.undoHistory.push(await dataUrlToImageData(dataUrl));
  }
  for (const dataUrl of (historyData.redo || [])) {
    layer.redoHistory.push(await dataUrlToImageData(dataUrl));
  }
}
