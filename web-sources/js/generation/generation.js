import { dom } from '../dom.js';
import { state } from '../state.js';
import { apiStopGeneration, apiGenerate, apiSelectModel } from './api.js';
import { processAndMergeImageLayer } from './imageLayerMerge.js';
import { generateInpaintBlackWhiteMaskBase64 } from '../canvas/maskBuilder.js';
import { handleGenerationEvent } from './generationEvents.js';
import { setStatus } from '../utils/misc.js';

export function initGeneration() {
  dom.generateBtn.addEventListener('click', onGenerateClick);
}

export function resetUiBeforeGeneration() {
  state.isGeneratingNow = true;
  state.userTriggeredStop = false;

  dom.generateBtn.disabled = false;
  dom.generateBtn.textContent = 'Stop generation';
  dom.generateBtn.classList.add('btn-stop');

  dom.downloadBtn.style.display = 'none';
  dom.placeholderText.style.display = 'none';
  dom.resultCanvas.style.display = 'none';
  dom.loadingSpinner.style.display = 'block';
  dom.progressContainer.style.display = 'block';
  dom.progressBar.style.width = '0%';
  dom.progressBar.textContent = '0%';
  dom.resultSliders.style.display = 'none';
  dom.showOriginalBtn.style.display = 'none';
  dom.sendToImg2ImgBtn.style.display = 'none';
}

async function onGenerateClick() {
  if (state.isGeneratingNow) {
    // STOP
    dom.generateBtn.disabled = true;
    dom.generateBtn.textContent = 'Stopping...';
    state.userTriggeredStop = true;
    try {
      await apiStopGeneration(dom.modelSelect.value);
    } catch (e) {
      console.error('Failed to send STOP signal:', e);
    }
    return;
  }

  let selectedScheduler = dom.generation.sampler.value;
  const isKarrasChecked = dom.generation.karras.checked;
  if (selectedScheduler !== 'lcm' && isKarrasChecked) {
    selectedScheduler += '_karras';
  }

  const payload = {
    prompt: dom.promptInput.value,
    negative_prompt: dom.negativePromptInput.value,
    steps: parseInt(dom.generation.steps.value),
    cfg: parseFloat(dom.generation.cfg.value),
    //size: dom.generation.size.textContent,
    width: parseInt(dom.generation.widthSlider.value),
    height: parseInt(dom.generation.heightSlider.value),
    scheduler: selectedScheduler,
    show_diffusion_process: false,
    show_diffusion_stride: 2,
  };

  // reference images
  const refImagesPayload = (state.refImages || []).map(item => {
    const originalImg = item.imageObject;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = originalImg.width;
    tempCanvas.height = originalImg.height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    tempCtx.drawImage(originalImg, 0, 0);
    const dataUrl = tempCanvas.toDataURL('image/png');
    return dataUrl.split(',')[1];
  });
  if (refImagesPayload.length > 0) {
    payload.reference_images = refImagesPayload;
  }

  const seedVal = parseInt(dom.generation.seed.value);
  if (seedVal !== -1) payload.seed = seedVal;

  const mergedImageBase64 = processAndMergeImageLayer();
  if (mergedImageBase64) {
    payload.image = mergedImageBase64[1];
    payload.denoise_strength = parseFloat(dom.generation.denoiseStrength.value);

    const maskBase64 = generateInpaintBlackWhiteMaskBase64();
    if (maskBase64) {
      payload.mask = maskBase64[1];
      state.lastGenerationHadMask = true;
    } else {
      state.lastGenerationHadMask = false;
    }
  } else {
    state.lastGenerationHadMask = false;
  }

  console.log(payload);

  resetUiBeforeGeneration();
  await startStreamingGeneration(payload);
}

async function startStreamingGeneration(payload) {
  try {
    const response = await apiGenerate(payload);
    if (!response.ok) throw new Error('Generation backend error');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.substring(6).trim();
          if (jsonStr) handleGenerationEvent(JSON.parse(jsonStr));
        }
      }
    }
  } catch (e) {
    state.isGeneratingNow = false;
    dom.loadingSpinner.style.display = 'none';
    dom.progressContainer.style.display = 'none';
    dom.placeholderText.style.display = 'block';

    if (state.userTriggeredStop) {
      state.userTriggeredStop = false;
      dom.generateBtn.disabled = true;
      dom.generateBtn.textContent = 'Restarting model...';
      dom.generateBtn.classList.remove('btn-stop');
      dom.generateBtn.classList.add('btn-busy');
      setStatus(dom.modelStatus, 'Status: Generation stopped. Restarting engine on the phone...', false);

      try {
        const response = await apiSelectModel(dom.modelSelect.value);
        if (response.ok) {
          setStatus(dom.modelStatus, 'Status: Ready. The model was automatically restarted after stopping.', false);
        } else {
          setStatus(dom.modelStatus, 'Status: Auto-restart error. Click Activate manually.', true);
        }
      } catch (err) {
        setStatus(dom.modelStatus, 'Status: Failed to contact the phone for auto-restart.', true);
      } finally {
        dom.generateBtn.textContent = 'Generate';
        dom.generateBtn.classList.remove('btn-busy');
        dom.generateBtn.disabled = false;
        dom.promptInput.dispatchEvent(new Event('input'));
        dom.negativePromptInput.dispatchEvent(new Event('input'));
      }
    } else {
      dom.generateBtn.textContent = 'Generate';
      dom.generateBtn.classList.remove('btn-stop');
      dom.generateBtn.classList.remove('btn-busy');
      dom.generateBtn.disabled = false;
      console.log('Generation stream interrupted due to a network error.', e);
    }
  }
}
