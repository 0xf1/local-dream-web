import { dom } from '../dom.js';
import { state } from '../state.js';
import { compositeResultWithMaskFeather } from './resultCompositing.js';

/** Render a standard base64 image (JPEG/PNG). */
export function drawBase64StandardImage(base64Str) {
  const img = new Image();
  img.onload = () => {
    const ctx = dom.resultCanvas.getContext('2d', { willReadFrequently: true });

    if (state.paddingInfo) {
      dom.resultCanvas.style.display = 'block';

      if (state.lastGenerationHadMask) {
        dom.resultCanvas.width = dom.bgImageCanvas.width;
        dom.resultCanvas.height = dom.bgImageCanvas.height;

        if (state.originalImageObject) {
          ctx.drawImage(state.originalImageObject, 0, 0);
        }
        compositeResultWithMaskFeather(ctx, img, state.paddingInfo);
      } else {
        const { padLeft, padTop, originalWidth, originalHeight, squareSize } = state.paddingInfo;
        const scale = img.width / squareSize;
        const sx = padLeft * scale;
        const sy = padTop * scale;
        const sw = originalWidth * scale;
        const sh = originalHeight * scale;

        dom.resultCanvas.width = sw;
        dom.resultCanvas.height = sh;

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      }
    } else {
      dom.resultCanvas.width = img.width;
      dom.resultCanvas.height = img.height;
      dom.resultCanvas.style.display = 'block';
      ctx.drawImage(img, 0, 0);
    }
  };
  img.src = `data:image/jpeg;base64,${base64Str}`;
}

/** Rendering "raw" RGB pixels from the server. */
export function drawRawRGBPixels(base64RawRGB, width, height) {
  const binaryString = atob(base64RawRGB);
  const rgbBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    rgbBytes[i] = binaryString.charCodeAt(i);
  }

  const tempSquareCanvas = document.createElement('canvas');
  tempSquareCanvas.width = width;
  tempSquareCanvas.height = height;
  const tempSquareCtx = tempSquareCanvas.getContext('2d', { willReadFrequently: true });
  const imageData = tempSquareCtx.createImageData(width, height);
  const data = imageData.data;

  let rgbIndex = 0, dataIndex = 0;
  while (rgbIndex < rgbBytes.length) {
    data[dataIndex] = rgbBytes[rgbIndex];
    data[dataIndex + 1] = rgbBytes[rgbIndex + 1];
    data[dataIndex + 2] = rgbBytes[rgbIndex + 2];
    data[dataIndex + 3] = 255;
    rgbIndex += 3;
    dataIndex += 4;
  }
  tempSquareCtx.putImageData(imageData, 0, 0);

  const ctx = dom.resultCanvas.getContext('2d', { willReadFrequently: true });

  if (state.paddingInfo) {
    dom.resultCanvas.style.display = 'block';

    if (state.lastGenerationHadMask) {
      dom.resultCanvas.width = dom.bgImageCanvas.width;
      dom.resultCanvas.height = dom.bgImageCanvas.height;

      if (state.originalImageObject) {
        ctx.drawImage(state.originalImageObject, 0, 0);
      }
      compositeResultWithMaskFeather(ctx, tempSquareCanvas, state.paddingInfo);
    } else {
      const { padLeft, padTop, originalWidth, originalHeight, squareSize } = state.paddingInfo;
      const scale = width / squareSize;
      const sx = padLeft * scale;
      const sy = padTop * scale;
      const sw = originalWidth * scale;
      const sh = originalHeight * scale;

      dom.resultCanvas.width = sw;
      dom.resultCanvas.height = sh;

      // Transfer only a clean image (without black fields/padding) to the canvas
      ctx.drawImage(
        tempSquareCanvas,
        sx, sy, sw, sh,
        0, 0, sw, sh
      );
    }

    state.lastServerResult = {
      tempSquareCanvas,
      paddingInfo: { ...state.paddingInfo },
      bgWidth: dom.bgImageCanvas.width,
      bgHeight: dom.bgImageCanvas.height,
    };
  } else {
    dom.resultCanvas.width = width;
    dom.resultCanvas.height = height;
    dom.resultCanvas.style.display = 'block';
    ctx.drawImage(tempSquareCanvas, 0, 0);
  }
}
