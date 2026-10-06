/**
 * Loads an <img> element from a dataUrl (or any image URL).
 * @param {string} dataUrl
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = dataUrl;
  });
}

/**
 * Converts a PNG dataUrl into an ImageData object (via a temporary canvas).
 * @param {string} dataUrl
 * @returns {Promise<ImageData>}
 */
export async function dataUrlToImageData(dataUrl) {
  const img = await loadImage(dataUrl);
  const c = document.createElement('canvas');
  c.width  = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, c.width, c.height);
}
