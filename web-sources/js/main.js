import { dom } from './dom.js';
import { state } from './state.js';
import { initImageUpload } from './canvas/imageUpload.js';
import { initCrop } from './canvas/crop.js';
import { initMagnifier, updateBrushCursorSize } from './canvas/magnifier.js';
import { initLayers } from './editor/layers.js';
import { initStrokeEnd } from './editor/drawing.js';
import { initVisualFilters } from './editor/visualFilters.js';
import { initModels, initApp } from './generation/models.js';
import { initGeneration } from './generation/generation.js';
import { initResultSliders } from './ui/resultSliders.js';
import { initSliderTouch } from './ui/sliderTouch.js';
import { initSizeControls } from './ui/sizeControls.js';
import { initTokens } from './generation/tokens.js';
import { initResultControls } from './ui/resultControls.js';
import { initDebug } from './ui/debug.js';
import { initSessionControls } from './ui/sessionControls.js';
import { initNotes } from './ui/notes.js';

function bindSliderLabels() {
  const ids = ['steps', 'cfg', 'denoiseStrength', 'brushSize',
               'layerOpacity', 'layerBlur', 'maskOpacity'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      const labelId = (id === 'denoiseStrength') ? 'denoiseVal' : `${id}Val`;
      const valLabel = document.getElementById(labelId);
      if (valLabel) valLabel.textContent = el.value;
      updateBrushCursorSize();
    });
  });
}

function init() {
  // Synchronous distribution of handlers
  bindSliderLabels();
  initImageUpload();
  initCrop();
  initMagnifier();
  initLayers();
  initStrokeEnd();
  initVisualFilters();
  initModels();
  initGeneration();
  initResultSliders();
  initSliderTouch();
  initSizeControls();
  initTokens();
  initResultControls();
  initDebug();
  initSessionControls();
  initNotes();

  // Asynchronous stage - network, directory, status
  initApp().catch(err => console.error('App init failed:', err));
}

window.addEventListener('DOMContentLoaded', init);
