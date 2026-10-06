import { dom } from '../dom.js';
import { state } from '../state.js';
import { makeCanvasSquare } from '../canvas/squareUtils.js';
import { compositeResultWithMaskFeather } from './resultCompositing.js';

/** Combines the original + paint layer, crops it if necessary. */
export function processAndMergeImageLayer() {
  if (!state.originalImageObject) return null;

  const paintCtx = dom.paintCanvas.getContext('2d', { willReadFrequently: true });
  const pData = paintCtx.getImageData(0, 0, dom.paintCanvas.width, dom.paintCanvas.height).data;

  let hasPaint = false;
  for (let i = 3; i < pData.length; i += 4) {
    if (pData[i] > 0) { hasPaint = true; break; }
  }

  const fullMergeCanvas = document.createElement('canvas');
  fullMergeCanvas.width  = dom.bgImageCanvas.width;
  fullMergeCanvas.height = dom.bgImageCanvas.height;
  const fullMergeCtx = fullMergeCanvas.getContext('2d', { willReadFrequently: true });
  fullMergeCtx.drawImage(state.originalImageObject, 0, 0);

  if (hasPaint) {
    fullMergeCtx.save();
    fullMergeCtx.globalAlpha = parseFloat(dom.layerOpacityInput.value);
    const blurVal = parseInt(dom.layerBlurInput.value);
    if (blurVal > 0) fullMergeCtx.filter = `blur(${blurVal}px)`;
    fullMergeCtx.drawImage(dom.paintCanvas, 0, 0);
    fullMergeCtx.restore();
  }

  let canvasToSquare = fullMergeCanvas;

  if (state.activeCropArea) {
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width  = state.activeCropArea.width;
    cropCanvas.height = state.activeCropArea.height;
    const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true });
    cropCtx.drawImage(
      fullMergeCanvas,
      state.activeCropArea.x, state.activeCropArea.y,
      state.activeCropArea.width, state.activeCropArea.height,
      0, 0, state.activeCropArea.width, state.activeCropArea.height
    );
    canvasToSquare = cropCanvas;
  }

  const squareResult = makeCanvasSquare(canvasToSquare, false);

  state.paddingInfo = {
    ...squareResult.info,
    isCrop: !!state.activeCropArea,
    cropX: state.activeCropArea ? state.activeCropArea.x : 0,
    cropY: state.activeCropArea ? state.activeCropArea.y : 0,
    cropWidth:  state.activeCropArea ? state.activeCropArea.width : 0,
    cropHeight: state.activeCropArea ? state.activeCropArea.height : 0,
  };

  return squareResult.canvas.toDataURL('image/png').split(',');
}

/** Redraw the result when changing the mask sliders. */
export function redrawResultFromLastGeneration() {
  if (!state.lastServerResult) return;
  const { tempSquareCanvas, paddingInfo: savedPadding } = state.lastServerResult;
  const ctx = dom.resultCanvas.getContext('2d', { willReadFrequently: true });
  dom.resultCanvas.width  = dom.bgImageCanvas.width;
  dom.resultCanvas.height = dom.bgImageCanvas.height;

  if (state.originalImageObject) {
    ctx.drawImage(state.originalImageObject, 0, 0);
  }
  compositeResultWithMaskFeather(ctx, tempSquareCanvas, savedPadding);
}
