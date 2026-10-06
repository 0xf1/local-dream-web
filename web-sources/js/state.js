// Global application state.
// Import specific fields or setState helpers.

export const state = {
  // Model / generation
  cachedCatalog: null,
  activeModel: {
    id: null,
    isDit: null,
    ditKind: null,
  },
  isGeneratingNow: false,
  userTriggeredStop: false,
  lastServerResult: null,      // { tempSquareCanvas, paddingInfo, ... }
  lastGenerationHadMask: false,

  // Image
  originalImageObject: null,
  paddingInfo: null,           // { originalWidth, originalHeight, padLeft, padTop, squareSize, isCrop, ... }

  // Ref Images
  refImages: [],

  // Layers
  layerStates: {
    mask:  { isEraser: false, undoHistory: [], redoHistory: [] },
    paint: { isEraser: false, undoHistory: [], redoHistory: [] },
  },
  isDrawing: false,
  // Pointer that owns the current stroke. Pointer events also fire for
  // touch, so this doubles as the "ignore extra fingers" lock.
  activePointerId: null,

  // Crop
  isCropMode: false,
  isCropping: false,
  cropStart: { x: 0, y: 0 },
  cropEnd:   { x: 0, y: 0 },
  activeCropArea: null,        // { x, y, width, height }

  // Debug
  debugOffsets: { canvas: 0, base64: 0 },
};

export function resetLayerHistories() {
  Object.keys(state.layerStates).forEach(k => {
    state.layerStates[k].undoHistory = [];
    state.layerStates[k].redoHistory = [];
    state.layerStates[k].isEraser = false;
  });
}

window.__state = state;
