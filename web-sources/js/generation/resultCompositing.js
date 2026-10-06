import { dom } from '../dom.js';
import { state } from '../state.js';
import { restoreServerResultToFullCanvas } from '../canvas/squareUtils.js';
import { buildFeatheredMaskFullSize } from '../canvas/maskBuilder.js';
import { debugShowCanvas, debugShowCropRegion } from '../ui/debug.js';

/** Composite the result with a feathered mask. */
export function compositeResultWithMaskFeather(ctx, tempSquareCanvas, paddingInfo) {
  const expandPx = parseInt(dom.maskFeatherInput.value, 10) || 0;
  const blurPx   = parseInt(dom.maskBlurInput.value, 10) || 0;
  const blendOpacity = (parseInt(dom.maskBlendInput.value, 10) || 0) / 100;

  const rawBrightness = parseFloat(dom.resultBrightness.value) || 0;
  const rawContrast   = parseFloat(dom.resultContrast.value) || 0;

  const fullResultCanvas = restoreServerResultToFullCanvas(tempSquareCanvas, paddingInfo);
  const featheredMask = buildFeatheredMaskFullSize(expandPx, blurPx);

  debugShowCanvas(tempSquareCanvas, 'Result');
  if (state.lastGenerationHadMask) debugShowCropRegion(featheredMask, 'feather');

  if (!featheredMask) {
    ctx.save();
    ctx.globalAlpha = blendOpacity;

    if (rawBrightness !== 0 || rawContrast !== 0) {
      const bCoeff = 1 + (rawBrightness / 100);
      const cCoeff = 1 + (rawContrast / 100);
      ctx.filter = `brightness(${bCoeff * 100}%) contrast(${cCoeff * 100}%)`;
    }

    ctx.drawImage(fullResultCanvas, 0, 0);
    ctx.restore();
    return;
  }

  const frCtx = fullResultCanvas.getContext('2d', { willReadFrequently: true });
  frCtx.globalCompositeOperation = 'destination-in';
  frCtx.drawImage(featheredMask, 0, 0);
  frCtx.globalCompositeOperation = 'source-over';

  ctx.save();
  ctx.globalAlpha = blendOpacity;

  if (rawBrightness !== 0 || rawContrast !== 0) {
    const bCoeff = 1 + (rawBrightness / 100);
    const cCoeff = 1 + (rawContrast / 100);
    ctx.filter = `brightness(${bCoeff * 100}%) contrast(${cCoeff * 100}%)`;
  }

  debugShowCropRegion(fullResultCanvas, 'afterMask');
  ctx.drawImage(fullResultCanvas, 0, 0);
  ctx.restore();
}
