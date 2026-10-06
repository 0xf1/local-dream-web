export const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');

export function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/**
 * @param {HTMLCanvasElement} c
 */
export function clearCanvas(c) {
  c.getContext('2d', { willReadFrequently: true }).clearRect(0, 0, c.width, c.height);
}

/**
 * Event coordinates in the canvas coordinate system (accounting for scale).
 * @param {{ clientX: number; clientY: number; }} e
 * @param {{ getBoundingClientRect: () => any; width: number; height: number; }} c
 */
export function getCanvasCoordinates(e, c) {
  const rect = c.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (c.width / rect.width),
    y: (e.clientY - rect.top)  * (c.height / rect.height),
  };
}

/**
 * All positions a pointer reported in this frame, in canvas coordinates.
 *
 * A touchscreen samples far faster than the display refreshes, so several
 * moves are coalesced into a single `pointermove`. Feeding only the last one
 * to the brush turns a quick finger swipe into a visible polygon.
 *
 * @param {PointerEvent & { getCoalescedEvents?: () => PointerEvent[] }} e
 * @param {{ getBoundingClientRect: () => any; width: number; height: number; }} c
 * @returns {{ x: number; y: number }[]}
 */
export function getStrokePoints(e, c) {
  const batch = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
  if (batch.length === 0) return [getCanvasCoordinates(e, c)];
  return batch.map(ev => getCanvasCoordinates(ev, c));
}

/**
* Sets the slider value, taking its step into account, and updates the interface.
* @param {HTMLInputElement} slider
* @param {number|string} val
*/
export function setSliderValue(slider, val) {
  const numValue = Number(val);

  if (!isNaN(numValue)) {
    const stepAttr = slider.getAttribute('step') || '1';

    if (stepAttr.includes('.')) {
      const decimals = stepAttr.split('.')[1].length;
      slider.value = numValue.toFixed(decimals);
    } else {
      slider.value = `${Math.round(numValue)}`;
    }
  } else {
    slider.value = String(val);
  }

  slider.dispatchEvent(new Event('input'));
}
