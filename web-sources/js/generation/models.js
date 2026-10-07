import { dom } from '../dom.js';
import { state } from '../state.js';
import { apiSelectModel, apiGetCatalog, apiGetStatus } from './api.js';
import { setSliderValue, setStatus } from '../utils/misc.js';
import { updateSizeText } from '../ui/sizeControls.js';

export function initModels() {
  dom.loadModelBtn.addEventListener('click', onLoadModel);
  // Auto-activate model on selection
  dom.modelSelect.addEventListener('change', () => {
    if (dom.modelSelect.value) {
      onLoadModel();
    }
  });
}

/**
 * Asynchronous initialization requiring network:
 * downloading the model catalog and checking the backend status.
 * Called from main.js AFTER init().
 */
export async function initApp() {
  await loadCatalog();
  await checkBackendStatus();
}

async function loadCatalog() {
  try {
    state.cachedCatalog = await apiGetCatalog();
    if (state.cachedCatalog?.models) {

      const firstOpt = dom.modelSelect.options[0];
      if (firstOpt) {
        firstOpt.textContent = 'Select a model...';
        firstOpt.disabled = true;
        firstOpt.hidden = true;
        firstOpt.value = '';
      }

      state.cachedCatalog.models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name || m.id;
        dom.modelSelect.appendChild(opt);
      });
    }
  } catch (e) {
    console.log('Catalog unavailable', e);
  }
}

async function checkBackendStatus() {
  try {
    const status = await apiGetStatus();

    if (status.state === 'running' || status.state === 'idle') {
      setStatus(dom.modelStatus, `Status: Ready. Active model: ${status.serving_model_id || 'Not selected'}`, false);

      dom.loadModelBtn.disabled = false;
      if (status.serving_model_id) {
        dom.generateBtn.disabled = false;

        if (dom.modelSelect.querySelector(
          `option[value="${status.serving_model_id}"]`
        )) {
          dom.modelSelect.value = status.serving_model_id;
          applyModelDefaults(status.serving_model_id);
          updateResolutionsForModel(status.serving_model_id);
        }
      }
    }
  } catch (e) {
    setStatus(dom.modelStatus, 'The generation backend is currently inactive.', true);
    console.log(dom.modelStatus.textContent, e);
  }
}

export async function onLoadModel() {
  const selectedModel = dom.modelSelect.value;

  dom.modelStatus.textContent = 'Launching the model on the phone (up to 30 seconds)...';
  dom.loadModelBtn.disabled = true;
  dom.generateBtn.disabled = true;

  try {
    const response = await apiSelectModel(selectedModel);

    if (response.ok) {
      setStatus(dom.modelStatus, 'The model has been successfully launched!', false);
      dom.generateBtn.disabled = false;
      applyModelDefaults(selectedModel);
      updateResolutionsForModel(selectedModel);
    } else {
      setStatus(dom.modelStatus, 'Model activation error.', true);
    }
  } catch (e) {
    setStatus(dom.modelStatus, 'Failed to send the activation request.', true);
  } finally {
    dom.loadModelBtn.disabled = false;
  }
}

export function updateResolutionsForModel(modelId) {
  const model = state.cachedCatalog?.models.find(m => m.id === modelId);
  const defaultSize = (model ? model.generation_size : 512) || 512;
  dom.generation.widthSlider.value = defaultSize;
  dom.generation.heightSlider.value = defaultSize;
  updateSizeText();

  dom.promptInput.dispatchEvent(new Event('input'));
  dom.negativePromptInput.dispatchEvent(new Event('input'));
}

export function applyModelDefaults(modelId) {
  const model = state.cachedCatalog?.models.find(m => m.id === modelId);
  if (!model || !model.defaults) return;
  const d = model.defaults;

  state.activeModel.id = model.id;
  state.activeModel.ditKind = model.dit_kind || "";
  state.activeModel.isDit = model.dit_kind === 'klein' || model.dit_kind === 'qwen21';

  setDefaultNonDirtyValues(dom.promptInput, d.prompt);
  setDefaultNonDirtyValues(dom.negativePromptInput, d.negative_prompt);

  if (d.steps) {
    setSliderValue(dom.generation.steps, d.steps);
  }

  if (d.cfg) {
    setSliderValue(dom.generation.cfg, d.cfg);
  }

  if (d.scheduler) {
    if (d.scheduler.endsWith('_karras')) {
      dom.generation.sampler.value = d.scheduler.replace('_karras', '');
      dom.generation.karras.checked = true;
    } else {
      dom.generation.sampler.value = d.scheduler;
      dom.generation.karras.checked = false;
    }
  }

  const isSizeDisabled = !model.dit_kind;
  dom.generation.widthSlider.disabled = isSizeDisabled;
  dom.generation.heightSlider.disabled = isSizeDisabled;

  dom.promptInput.dispatchEvent(new Event('input'));
  dom.negativePromptInput.dispatchEvent(new Event('input'));

  dom.uploadImgBtn.textContent = state.activeModel.isDit ? 'Select base image' : 'Select image';
  dom.editModeLabel.textContent = state.activeModel.isDit ? "Edit:" : "Img2Img:";

  // Show/hide ref image upload button based on model type
  if (state.activeModel.isDit) {
    dom.uploadRefImgBtn.style.display = '';
  } else {
    dom.uploadRefImgBtn.style.display = 'none';
  }

  dom.modelWorkspace.style.display = "block";

  setSliderValue(dom.generation.denoiseStrength, (state.activeModel.isDit ? 1.0: 0.6))

  console.log('Model settings applied', model);
}

function setDefaultNonDirtyValues(inputElement, defaultValue) {
  if (defaultValue !== undefined && !inputElement.hasAttribute('data-dirty')) {
    inputElement.value = defaultValue || '';
  }
}
