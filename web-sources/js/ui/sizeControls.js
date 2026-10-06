import { dom } from '../dom.js';

export function updateSizeText() {
    dom.generation.sizeSummary.textContent = `${dom.generation.widthSlider.value}x${dom.generation.heightSlider.value}`;
}

/** Bind the width and height sliders to the size summary. */
export function initSizeControls() {
    dom.generation.widthSlider.addEventListener('input', updateSizeText);
    dom.generation.heightSlider.addEventListener('input', updateSizeText);

    updateSizeText();
}
