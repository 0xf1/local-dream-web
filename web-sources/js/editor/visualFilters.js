import { dom } from '../dom.js';

export function initVisualFilters() {
  dom.maskOpacityInput.addEventListener('input', updateMaskVisualOpacity);
  dom.layerOpacityInput.addEventListener('input', updatePaintLayerVisualFilters);
  dom.layerBlurInput.addEventListener('input', updatePaintLayerVisualFilters);
}

export function updateMaskVisualOpacity() {
  dom.maskCanvas.style.opacity = dom.maskOpacityInput.value;
}

export function updatePaintLayerVisualFilters() {
  dom.paintCanvas.style.opacity = dom.layerOpacityInput.value;
  const blur = dom.layerBlurInput.valueAsNumber;
  dom.paintCanvas.style.filter = blur > 0 ? `blur(${blur}px)` : 'none';
}
