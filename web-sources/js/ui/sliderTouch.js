/** Horizontal movement needed before a touch counts as a deliberate drag. */
const DRAG_THRESHOLD = 6;

/** The slider currently under a finger, or null. One at a time is enough. */
let press = null;

export function initSliderTouch() {
  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', endPress);
  document.addEventListener('pointercancel', cancelPress);
}

/**
 * A mouse is left entirely alone: clicking a track to set a value is expected
 * there. Only a touch is examined, and only its first few pixels of travel.
 */
function onPointerDown(event) {
  if (press !== null) return;
  if (event.pointerType === 'mouse') return;

  const slider = sliderFrom(event.target);
  if (!slider) return;

  // Read before the default action runs: this is the value the press is about
  // to overwrite, and the only way back to it.
  press = {
    pointerId: event.pointerId,
    slider,
    startX: event.clientX,
    startY: event.clientY,
    startValue: slider.value,
    isDrag: false,
  };
}

/**
 * Chrome commits the value at the touch point on press, before it knows
 * whether the gesture will become a page scroll. touch-action cannot prevent
 * that, because the pan decision is made after the value is already changed.
 *
 * So: a clear horizontal move means the user means to drag the slider and the
 * new value stands, while a mostly vertical move means the page is scrolling
 * and the jump is undone.
 */
function onPointerMove(event) {
  if (!press || event.pointerId !== press.pointerId || press.isDrag) return;

  const dx = Math.abs(event.clientX - press.startX);
  const dy = Math.abs(event.clientY - press.startY);

  if (dx > DRAG_THRESHOLD && dx > dy) {
    press.isDrag = true;
    return;
  }
  if (dy > dx) restoreValue();
}

/** The browser took the gesture for a pan. Undo the jump and stop watching. */
function cancelPress(event) {
  if (!press || event.pointerId !== press.pointerId) return;
  if (!press.isDrag) {
    restoreValue();
    return;
  }
  press = null;
}

/** A tap is deliberate: whatever Chrome committed stays. */
function endPress(event) {
  if (!press || event.pointerId !== press.pointerId) return;
  press = null;
}

/**
 * Puts the value back the press changed. The jump fired an input event, so the
 * value label and the canvas filters are already showing the wrong number and
 * need another event to catch up.
 */
function restoreValue() {
  const { slider, startValue } = press;
  press = null;

  if (slider.value === startValue) return;
  slider.value = startValue;
  slider.dispatchEvent(new Event('input'));
}

/**
 * @param {EventTarget | null} target
 * @returns {HTMLInputElement | null}
 */
function sliderFrom(target) {
  return (target instanceof HTMLInputElement && target.type === 'range') ? target : null;
}