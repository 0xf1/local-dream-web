// Centralized access to all DOM elements.
// Imported in all modules that require access to the DOM.

export const dom = {

  modelWorkspace: (/** @type {HTMLDivElement} */ (document.getElementById('modelWorkspace'))),

  // Model
  modelSelect:   (/** @type {HTMLSelectElement} */ (document.getElementById('modelSelect'))),
  loadModelBtn:  (/** @type {HTMLButtonElement} */ (document.getElementById('loadModelBtn'))),
  modelStatus:   (/** @type {HTMLParagraphElement} */ (document.getElementById('modelStatus'))),
  generateBtn:   (/** @type {HTMLButtonElement} */ (document.getElementById('generateBtn'))),
  progressBar:   (/** @type {HTMLDivElement} */ (document.getElementById('progressBar'))),
  progressContainer: (/** @type {HTMLDivElement} */ (document.getElementById('progressContainer'))),
  resultCanvas:  (/** @type {HTMLCanvasElement} */ (document.getElementById('resultCanvas'))),
  placeholderText: (/** @type {HTMLParagraphElement} */ (document.getElementById('placeholderText'))),
  loadingSpinner:  (/** @type {HTMLDivElement} */ (document.getElementById('loadingSpinner'))),
  downloadBtn:   (/** @type {HTMLButtonElement} */ (document.getElementById('downloadBtn'))),

  // Loading image
  img2imgFile:   (/** @type {HTMLInputElement} */ (document.getElementById('img2imgFile'))),
  img2imgRefFile:   (/** @type {HTMLInputElement} */ (document.getElementById('img2imgRefFile'))),
  editModeLabel: (/** @type {HTMLLabelElement} */ (document.getElementById('editModeLabel'))),
  uploadImgBtn:  (/** @type {HTMLButtonElement} */ (document.getElementById('uploadImgBtn'))),
  uploadRefImgBtn:  (/** @type {HTMLButtonElement} */ (document.getElementById('uploadRefImgBtn'))),
  refImages:  (/** @type {HTMLDivElement} */ (document.getElementById('refImagesContainer'))),
  clearImgBtn:   (/** @type {HTMLButtonElement} */ (document.getElementById('clearImgBtn'))),
  lightboxOverlay: (/** @type {HTMLDivElement} */ (document.getElementById('lightboxOverlay'))),
  lightboxImage:   (/** @type {HTMLImageElement} */ (document.getElementById('lightboxImage'))),
  canvasWorkspace: (/** @type {HTMLDivElement} */ (document.getElementById('canvasWorkspace'))),

  // Canvas layers
  bgImageCanvas: (/** @type {HTMLCanvasElement} */ (document.getElementById('bgImageCanvas'))),
  paintCanvas:   (/** @type {HTMLCanvasElement} */ (document.getElementById('paintDrawingCanvas'))),
  maskCanvas:    (/** @type {HTMLCanvasElement} */ (document.getElementById('maskDrawingCanvas'))),
  brushCursor:   (/** @type {HTMLDivElement} */ (document.getElementById('brushCursor'))),

  // Layer control panel
  layerModeSelect:  (/** @type {HTMLSelectElement} */ (document.getElementById('layerMode'))),
  colorPickerGroup: (/** @type {HTMLDivElement} */ (document.getElementById('colorPickerGroup'))),
  brushColorInput:  (/** @type {HTMLInputElement} */ (document.getElementById('brushColor'))),
  brushSizeInput:   (/** @type {HTMLInputElement} */ (document.getElementById('brushSize'))),
  paintSettingsRow: (/** @type {HTMLDivElement} */ (document.getElementById('paintSettingsRow'))),
  maskSettingsRow:  (/** @type {HTMLDivElement} */ (document.getElementById('maskSettingsRow'))),
  layerOpacityInput: (/** @type {HTMLInputElement} */ (document.getElementById('layerOpacity'))),
  layerBlurInput:    (/** @type {HTMLInputElement} */ (document.getElementById('layerBlur'))),
  maskOpacityInput:  (/** @type {HTMLInputElement} */ (document.getElementById('maskOpacity'))),

  eraserBtn: (/** @type {HTMLButtonElement} */ (document.getElementById('eraserBtn'))),
  undoBtn:   (/** @type {HTMLButtonElement} */ (document.getElementById('undoBtn'))),
  redoBtn:   (/** @type {HTMLButtonElement} */ (document.getElementById('redoBtn'))),
  clearLayerBtn: (/** @type {HTMLButtonElement} */ (document.getElementById('clearLayerBtn'))),
  sendToImg2ImgBtn: (/** @type {HTMLButtonElement} */ (document.getElementById('sendToImg2ImgBtn'))),
  showOriginalBtn:  (/** @type {HTMLButtonElement} */ (document.getElementById('showOriginalBtn'))),
  resetToDefaultsBtn: (/** @type {HTMLButtonElement} */ (document.getElementById('resetToDefaultsBtn'))),
  magnifierCheckbox:  (/** @type {HTMLInputElement} */ (document.getElementById('magnifierCheckbox'))),
  canvasWrapper: (/** @type {HTMLDivElement} */ (document.querySelector('.canvas-container-wrapper'))),

  // Crop
  cropModeBtn:  (/** @type {HTMLButtonElement} */ (document.getElementById('cropModeBtn'))),
  clearCropBtn: (/** @type {HTMLButtonElement} */ (document.getElementById('clearCropBtn'))),
  cropOverlayCanvas: (/** @type {HTMLCanvasElement} */ (document.getElementById('cropOverlayCanvas'))),

  // Result sliders
  resultSliders:   (/** @type {HTMLDivElement} */ (document.getElementById('resultSliders'))),
  maskFeatherInput: (/** @type {HTMLInputElement} */ (document.getElementById('maskFeather'))),
  maskFeatherVal:   (/** @type {HTMLSpanElement} */ (document.getElementById('maskFeatherVal'))),
  maskFeatherReset:   (/** @type {HTMLButtonElement} */ (document.getElementById('maskFeatherReset'))),
  maskBlendInput:   (/** @type {HTMLInputElement} */ (document.getElementById('maskBlend'))),
  maskBlendVal:     (/** @type {HTMLSpanElement} */ (document.getElementById('maskBlendVal'))),
  maskBlendReset:   (/** @type {HTMLButtonElement} */ (document.getElementById('maskBlendReset'))),
  maskBlurInput:    (/** @type {HTMLInputElement} */ (document.getElementById('maskBlur'))),
  maskBlurVal:      (/** @type {HTMLSpanElement} */ (document.getElementById('maskBlurVal'))),
  maskBlurReset:   (/** @type {HTMLButtonElement} */ (document.getElementById('maskBlurReset'))),
  resultBrightness: (/** @type {HTMLInputElement} */ (document.getElementById('resultBrightness'))),
  resultBrightnessVal:   (/** @type {HTMLSpanElement} */ (document.getElementById('resultBrightnessVal'))),
  resultBrightnessReset:   (/** @type {HTMLButtonElement} */ (document.getElementById('resultBrightnessReset'))),
  resultContrast:   (/** @type {HTMLInputElement} */ (document.getElementById('resultContrast'))),
  resultContrastVal:   (/** @type {HTMLSpanElement} */ (document.getElementById('resultContrastVal'))),
  resultContrastReset:   (/** @type {HTMLButtonElement} */ (document.getElementById('resultContrastReset'))),

  // Debug
  showDebugCheckbox: (/** @type {HTMLInputElement} */ (document.getElementById('showDebugCheckbox'))),

  // Prompts
  promptInput:        (/** @type {HTMLTextAreaElement} */ (document.getElementById('prompt'))),
  negativePromptInput: (/** @type {HTMLTextAreaElement} */ (document.getElementById('negativePrompt'))),
  tokenCounter:        (/** @type {HTMLParagraphElement} */ (document.getElementById('tokenCounter'))),
  negativeTokenCounter: (/** @type {HTMLParagraphElement} */ (document.getElementById('negativeTokenCounter'))),

  // Generation params
  generation: {
    denoiseStrength:      (/** @type {HTMLInputElement} */ (document.getElementById('denoiseStrength'))),
    sampler:              (/** @type {HTMLSelectElement} */ (document.getElementById('samplerSelect'))),
    karras:               (/** @type {HTMLInputElement} */ (document.getElementById('karrasCheckbox'))),
    steps:                (/** @type {HTMLInputElement} */ (document.getElementById('steps'))),
    cfg:                  (/** @type {HTMLInputElement} */ (document.getElementById('cfg'))),
    seed:                 (/** @type {HTMLInputElement} */ (document.getElementById('seed'))),
    sizeSummary:          (/** @type {HTMLSpanElement} */ (document.getElementById('sizeSummary'))),
    widthSlider:          (/** @type {HTMLInputElement} */ (document.getElementById('widthSlider'))),
    heightSlider:         (/** @type {HTMLInputElement} */ (document.getElementById('heightSlider'))),
  },

  // Notes widget
  notesBtn:      (/** @type {HTMLButtonElement} */ (document.getElementById('notesBtn'))),
  notesWidget:   (/** @type {HTMLDivElement} */ (document.getElementById('notesWidget'))),
  notesHeader:   (/** @type {HTMLDivElement} */ (document.getElementById('notesHeader'))),
  notesCloseBtn: (/** @type {HTMLButtonElement} */ (document.getElementById('notesCloseBtn'))),
  notesTextarea: (/** @type {HTMLTextAreaElement} */ (document.getElementById('notesTextarea'))),
};

// Magnifier is created dynamically
export const magnifier = document.createElement('canvas');
magnifier.className = 'canvas-magnifier';
magnifier.width  = 150;
magnifier.height = 150;
if (dom.canvasWrapper) dom.canvasWrapper.appendChild(magnifier);
