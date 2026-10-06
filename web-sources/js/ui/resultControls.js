import { dom } from '../dom.js';
import { state } from '../state.js';
import { pad } from '../utils/misc.js';
import { updateBrushCursorSize } from '../canvas/magnifier.js';
import { loadImageIntoEditor } from '../editor/editorState.js';

export function initResultControls() {
  dom.downloadBtn.addEventListener('click', onDownload);
  dom.sendToImg2ImgBtn.addEventListener('click', onSendToImg2Img);
  dom.resultCanvas.addEventListener('click', onResultClick);
  dom.lightboxOverlay.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', onLightboxKeydown);

  // Hold to compare with the original. Pointer events replace the old
  // mousedown/mouseup + touchstart/touchend pair, which could leave the
  // original image stuck on screen if the finger slid off the button.
  dom.showOriginalBtn.addEventListener('pointerdown', showOriginal);
  dom.showOriginalBtn.addEventListener('pointerup', hideOriginal);
  dom.showOriginalBtn.addEventListener('pointercancel', hideOriginal);
  dom.showOriginalBtn.addEventListener('pointerleave', hideOriginal);
  dom.showOriginalBtn.addEventListener('lostpointercapture', hideOriginal);
}

function onDownload() {
  const now = new Date();
  const fileName = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.png`;
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dom.resultCanvas.toDataURL('image/png');
  link.click();
}

function onSendToImg2Img() {
  if (dom.resultCanvas.style.display === 'none') return;

  const img = new Image();
  img.onload = () => {
    loadImageIntoEditor(img);
    dom.canvasWorkspace.scrollIntoView({ behavior: 'smooth' });
    setTimeout(updateBrushCursorSize, 50);
  };
  img.src = dom.resultCanvas.toDataURL('image/png');
}

function onResultClick() {
  if (dom.resultCanvas.style.display === 'none') return;
  dom.lightboxImage.src = dom.resultCanvas.toDataURL('image/png');
  dom.lightboxOverlay.style.display = 'flex';
}

function closeLightbox() {
  dom.lightboxOverlay.style.display = 'none';
  dom.lightboxImage.removeAttribute('src');
}

function onLightboxKeydown(event) {
  if (event.key === 'Escape' && dom.lightboxOverlay.style.display === 'flex') {
    closeLightbox();
  }
}

function showOriginal() {
  if (!state.originalImageObject || dom.resultCanvas.style.display === 'none') return;

  let wrapper = dom.resultCanvas.parentElement;
  if (!wrapper.classList.contains('canvas-result-wrapper')) {
    wrapper = document.createElement('div');
    wrapper.className = 'canvas-result-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    dom.resultCanvas.parentNode.insertBefore(wrapper, dom.resultCanvas);
    wrapper.appendChild(dom.resultCanvas);
  }

  let tempOrig = (/** @type {HTMLCanvasElement} */ (document.getElementById('tempOriginalCanvas')));
  if (!tempOrig) {
    tempOrig = document.createElement('canvas');
    tempOrig.id = 'tempOriginalCanvas';
    tempOrig.className = 'zoomable-canvas';
    tempOrig.style.position = 'absolute';
    tempOrig.style.top = '0';
    tempOrig.style.left = '0';
    tempOrig.style.zIndex = '20';
    tempOrig.style.pointerEvents = 'none';
    wrapper.appendChild(tempOrig);
  }

  const resultRect = dom.resultCanvas.getBoundingClientRect();
  tempOrig.style.width  = `${resultRect.width}px`;
  tempOrig.style.height = `${resultRect.height}px`;

  tempOrig.width  = dom.resultCanvas.width;
  tempOrig.height = dom.resultCanvas.height;

  const ctx = tempOrig.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, tempOrig.width, tempOrig.height);
  ctx.drawImage(state.originalImageObject, 0, 0, dom.resultCanvas.width, dom.resultCanvas.height);
  tempOrig.style.display = 'block';
}

function hideOriginal() {
  const tempOrig = document.getElementById('tempOriginalCanvas');
  if (tempOrig) tempOrig.style.display = 'none';
}
