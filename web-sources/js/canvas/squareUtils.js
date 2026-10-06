import { dom } from '../dom.js';

/**
* Forces the canvas to be square (maxDim x maxDim), centering the source.
* @param {HTMLCanvasElement} sourceCanvas
* @param {boolean} isMask - if true, the background is black (mask).
* @returns {{canvas: HTMLCanvasElement, info: object}}
*/
export function makeCanvasSquare(sourceCanvas, isMask = false) {
  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;
  const maxDim = Math.max(srcW, srcH);

  const squareCanvas = document.createElement('canvas');
  squareCanvas.width  = maxDim;
  squareCanvas.height = maxDim;
  const sqCtx = squareCanvas.getContext('2d', { willReadFrequently: true });

  sqCtx.fillStyle = '#000000';
  sqCtx.fillRect(0, 0, maxDim, maxDim);

  const padLeft = Math.floor((maxDim - srcW) / 2);
  const padTop  = Math.floor((maxDim - srcH) / 2);
  sqCtx.drawImage(sourceCanvas, padLeft, padTop);

  return {
    canvas: squareCanvas,
    info: {
      originalWidth: srcW,
      originalHeight: srcH,
      padLeft,
      padTop,
      squareSize: maxDim,
    },
  };
}

/**
* Scales the square server result back to the bgImageCanvas coordinate system.
* Works for both crop and non-crop modes.
*/
export function restoreServerResultToFullCanvas(tempSquareCanvas, paddingInfo) {
  const out = document.createElement('canvas');
  out.width  = dom.bgImageCanvas.width;
  out.height = dom.bgImageCanvas.height;
  const octx = out.getContext('2d', { willReadFrequently: true });

  const scaleX = tempSquareCanvas.width  / paddingInfo.squareSize;
  const scaleY = tempSquareCanvas.height / paddingInfo.squareSize;

  const srcX = paddingInfo.padLeft * scaleX;
  const srcY = paddingInfo.padTop  * scaleY;
  const srcW = paddingInfo.originalWidth  * scaleX;
  const srcH = paddingInfo.originalHeight * scaleY;

  if (paddingInfo.isCrop) {
    octx.drawImage(
      tempSquareCanvas,
      srcX, srcY, srcW, srcH,
      paddingInfo.cropX, paddingInfo.cropY,
      paddingInfo.cropWidth, paddingInfo.cropHeight
    );
  } else {
    octx.drawImage(
      tempSquareCanvas,
      srcX, srcY, srcW, srcH,
      0, 0, paddingInfo.originalWidth, paddingInfo.originalHeight
    );
  }
  return out;
}
