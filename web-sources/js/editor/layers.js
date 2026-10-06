import { dom } from '../dom.js';
import { state } from '../state.js';
import { MAX_HISTORY } from '../config.js';
import { clearCanvas } from '../utils/misc.js';

export function initLayers() {
  dom.layerModeSelect.addEventListener('change', onLayerModeChange);
  dom.clearLayerBtn.addEventListener('click', onClearLayer);
  dom.eraserBtn.addEventListener('click', onToggleEraser);
  dom.undoBtn.addEventListener('click', onUndo);
  dom.redoBtn.addEventListener('click', onRedo);

  // Pointer events cover mouse, stylus and touch with a single pair of
  // handlers. The stroke itself is finished by the global listener in
  // drawing.js, so the finger may leave the canvas without cutting it short.
  [dom.maskCanvas, dom.paintCanvas].forEach(c => {
    c.addEventListener('pointerdown', (e) => startDrawingFlow(e, c));
    c.addEventListener('pointermove', (e) => drawFlow(e, c));
  });
}

function onLayerModeChange() {
  const mode = dom.layerModeSelect.value;
  if (mode === 'paint') {
    dom.paintSettingsRow.style.display = 'flex';
    dom.maskSettingsRow.style.display  = 'none';
    dom.colorPickerGroup.style.display = 'flex';
    dom.maskCanvas.style.display = 'none';
    dom.paintCanvas.style.display = 'block';
    dom.paintCanvas.style.pointerEvents = 'auto';
  } else {
    dom.paintSettingsRow.style.display = 'none';
    dom.maskSettingsRow.style.display  = 'flex';
    dom.colorPickerGroup.style.display = 'none';
    dom.maskCanvas.style.display = 'block';
    dom.maskCanvas.style.pointerEvents = 'auto';
    dom.paintCanvas.style.pointerEvents = 'none';
  }
  syncEraserButton();
}

/** Point the eraser button at the current mode's isEraser flag. */
export function syncEraserButton() {
  const isEraser = state.layerStates[dom.layerModeSelect.value].isEraser;
  dom.eraserBtn.classList.toggle('active-tool', isEraser);
  dom.eraserBtn.textContent = isEraser ? 'Mode: Eraser' : 'Eraser';
}

function onClearLayer() {
  const activeCanvas = (dom.layerModeSelect.value === 'mask') ? dom.maskCanvas : dom.paintCanvas;
  clearCanvas(activeCanvas);
  saveActiveLayerState();
}

function onToggleEraser() {
  const mode = dom.layerModeSelect.value;
  state.layerStates[mode].isEraser = !state.layerStates[mode].isEraser;
  syncEraserButton();
}

export function saveActiveLayerState() {
  const mode = dom.layerModeSelect.value;
  const activeCanvas = (mode === 'mask') ? dom.maskCanvas : dom.paintCanvas;
  const ctx = activeCanvas.getContext('2d', { willReadFrequently: true });

  if (state.layerStates[mode].undoHistory.length >= MAX_HISTORY) {
    state.layerStates[mode].undoHistory.shift();
  }
  state.layerStates[mode].undoHistory.push(
    ctx.getImageData(0, 0, activeCanvas.width, activeCanvas.height)
  );
  state.layerStates[mode].redoHistory = [];
}

function onUndo() {
  const mode = dom.layerModeSelect.value;
  const history = state.layerStates[mode].undoHistory;
  if (history.length <= 1) return;

  const activeCanvas = (mode === 'mask') ? dom.maskCanvas : dom.paintCanvas;
  const ctx = activeCanvas.getContext('2d', { willReadFrequently: true });

  state.layerStates[mode].redoHistory.push(history.pop());
  const prevState = history[history.length - 1];
  ctx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
  ctx.putImageData(prevState, 0, 0);
}

function onRedo() {
  const mode = dom.layerModeSelect.value;
  const redo = state.layerStates[mode].redoHistory;
  if (redo.length === 0) return;

  const activeCanvas = (mode === 'mask') ? dom.maskCanvas : dom.paintCanvas;
  const ctx = activeCanvas.getContext('2d', { willReadFrequently: true });

  const nextState = redo.pop();
  state.layerStates[mode].undoHistory.push(nextState);
  ctx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
  ctx.putImageData(nextState, 0, 0);
}

// Import from drawing.js
import { startDrawingFlow, drawFlow } from './drawing.js';
