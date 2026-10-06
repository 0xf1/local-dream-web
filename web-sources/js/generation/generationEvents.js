import { dom } from '../dom.js';
import { state } from '../state.js';
import { drawBase64StandardImage, drawRawRGBPixels } from './resultDecoders.js';

/** Main handler of SSE events from the server. */
export function handleGenerationEvent(data) {
  if (data.type === 'progress') {
    const percent = Math.round((data.step / data.total_steps) * 100);
    dom.progressBar.style.width = `${percent}%`;
    dom.progressBar.textContent = `Step ${data.step}/${data.total_steps} (${percent}%)`;
    if (data.image) drawBase64StandardImage(data.image);
  } else if (data.type === 'complete') {
    state.isGeneratingNow = false;
    dom.progressBar.textContent = 'Done!';
    dom.loadingSpinner.style.display = 'none';
    dom.progressBar.style.width = `${100}%`;

    drawRawRGBPixels(data.image, data.width, data.height);

    dom.generateBtn.textContent = 'Generate';
    dom.generateBtn.classList.remove('btn-stop');
    dom.generateBtn.disabled = false;

    dom.downloadBtn.style.display = 'block';
    dom.sendToImg2ImgBtn.style.display = 'block';
    if (state.originalImageObject) dom.showOriginalBtn.style.display = 'block';
    dom.resultSliders.style.display = state.lastGenerationHadMask ? 'flex' : 'none';
  } else if (data.type === 'error') {
    state.isGeneratingNow = false;
    alert('Backend error: ' + data.message);
    dom.generateBtn.textContent = 'Generate';
    dom.generateBtn.classList.remove('btn-stop');
    dom.generateBtn.disabled = false;
    dom.loadingSpinner.style.display = 'none';
    dom.showOriginalBtn.style.display = 'none';
    dom.resultSliders.style.display = 'none';
  }
}
