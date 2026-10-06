import { dom } from '../dom.js';
import { debounce } from '../utils/misc.js';
import { redrawResultFromLastGeneration } from '../generation/imageLayerMerge.js';

const debouncedRedraw = debounce(redrawResultFromLastGeneration, 50);

/** Slider configs: input, its value label, formatter and reset value/label. */
const SLIDER_CONFIGS = [
  { input: () => dom.maskFeatherInput, val: () => dom.maskFeatherVal, format: v => v },
  { input: () => dom.maskBlendInput,   val: () => dom.maskBlendVal,   format: v => v },
  { input: () => dom.maskBlurInput,    val: () => dom.maskBlurVal,    format: v => v },
  {
    input: () => dom.resultBrightness, val: () => dom.resultBrightnessVal,
    format: v => (parseFloat(v) || 0).toFixed(2),
  },
  {
    input: () => dom.resultContrast, val: () => dom.resultContrastVal,
    format: v => (parseFloat(v) || 0).toFixed(2),
  },
];

const RESET_CONFIGS = [
  { btn: () => dom.resultBrightnessReset, input: () => dom.resultBrightness, val: () => dom.resultBrightnessVal, resetTo: '0', label: '0.0' },
  { btn: () => dom.resultContrastReset,   input: () => dom.resultContrast,   val: () => dom.resultContrastVal,   resetTo: '0', label: '0.0' },
  { btn: () => dom.maskFeatherReset,      input: () => dom.maskFeatherInput, val: () => dom.maskFeatherVal,      resetTo: '10', label: '10' },
  { btn: () => dom.maskBlurReset,         input: () => dom.maskBlurInput,    val: () => dom.maskBlurVal,         resetTo: '10', label: '10' },
  { btn: () => dom.maskBlendReset,        input: () => dom.maskBlendInput,   val: () => dom.maskBlendVal,        resetTo: '100', label: '100' },
];

/** Bind sliders (feather/blend/blur/brightness/contrast) and their reset buttons. */
export function initResultSliders() {
  SLIDER_CONFIGS.forEach(({ input, val, format }) => {
    input().addEventListener('input', () => {
      val().textContent = format(input().value);
      debouncedRedraw();
    });
  });

  RESET_CONFIGS.forEach(({ btn, input, val, resetTo, label }) => {
    btn().addEventListener('click', (e) => {
      e.preventDefault();
      input().value = resetTo;
      val().textContent = label;
      redrawResultFromLastGeneration();
    });
  });
}
