import { dom } from '../dom.js';
import { state } from '../state.js';

export const FILE_VERSION = 1;
const SESSION_HISTORY_LIMIT = 25; // number of recent undo/redo snapshots to save to the file

/**
 * Serialization
 * @param {import('../types.jsdoc.js').SessionSaveOptions} options
 */
export function buildSessionSnapshot(options) {

  const snapshot = {
    version: FILE_VERSION,
    savedAt: new Date().toISOString(),
  };

  if (options.model && dom.modelSelect?.value?.trim()) {
    snapshot.modelId = dom.modelSelect.value;
  }

  if (options.prompt) {
    snapshot.prompt = dom.promptInput.value;
    snapshot.negativePrompt = dom.negativePromptInput.value;
  }

  if (options.denoiseStrength) {
    snapshot.denoiseStrength = dom.generation.denoiseStrength.value;
  }

  if (options.advancedGenParams) {
    snapshot.advancedGenerationParams = {
      cfg: dom.generation.cfg.value,
      karras: dom.generation.karras.checked,
      sampler: dom.generation.sampler.value,
      seed: dom.generation.seed.value,
      width: dom.generation.widthSlider.value,
      height: dom.generation.heightSlider.value,
      steps: dom.generation.steps.value,
    };
  }

  if ((options.img2img) && (state.originalImageObject)) {
    snapshot.img2img =  {
      original: {
        dataUrl: canvasToDataUrl(dom.bgImageCanvas),
        width: dom.bgImageCanvas.width,
        height: dom.bgImageCanvas.height,
      },
      mask: {
        dataUrl: canvasToDataUrl(dom.maskCanvas),
        width: dom.maskCanvas.width,
        height: dom.maskCanvas.height,
      },
      paint: {
        dataUrl: canvasToDataUrl(dom.paintCanvas),
        width: dom.paintCanvas.width,
        height: dom.paintCanvas.height,
      },

      crop: state.activeCropArea ? { ...state.activeCropArea } : null,
      paddingInfo: state.paddingInfo ? { ...state.paddingInfo } : null,

      ui: {
        layerMode: dom.layerModeSelect.value,
        isEraser: {
          mask:  state.layerStates.mask.isEraser,
          paint: state.layerStates.paint.isEraser,
        },
        brushColor:   dom.brushColorInput.value,
        brushSize:    dom.brushSizeInput.value,
        layerOpacity: dom.layerOpacityInput.value,
        layerBlur:    dom.layerBlurInput.value,
        maskOpacity:  dom.maskOpacityInput.value,
        maskFeather:  dom.maskFeatherInput.value,
        maskBlend:    dom.maskBlendInput.value,
        maskBlur:     dom.maskBlurInput.value,
      },

      history: {
        mask:  serializeLayerHistory('mask'),
        paint: serializeLayerHistory('paint'),
      },
    };
  }

  return snapshot;
}

function canvasToDataUrl(canvas) {
  if (!canvas || canvas.width === 0) return null;
  return canvas.toDataURL('image/png');
}

/**
 * Serializes the layer's undoHistory/redoHistory.
 * Each ImageData → temporary canvas → PNG data-url.
 * We keep only the last SESSION_HISTORY_LIMIT snapshots
 * to prevent the file size from ballooning.
 */
function serializeLayerHistory(mode) {
  const layer = state.layerStates[mode];
  const undo = layer.undoHistory.slice(-SESSION_HISTORY_LIMIT).map(imageDataToDataUrl);
  const redo = layer.redoHistory.slice(-SESSION_HISTORY_LIMIT).map(imageDataToDataUrl);
  return { undo, redo };
}

function imageDataToDataUrl(imageData) {
  const c = document.createElement('canvas');
  c.width  = imageData.width;
  c.height = imageData.height;
  c.getContext('2d', { willReadFrequently: true }).putImageData(imageData, 0, 0);
  return c.toDataURL('image/png');
}
