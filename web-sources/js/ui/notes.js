import { dom } from '../dom.js';

const NOTES_STORAGE_KEY = 'local_dream_notes';

const VISIBLE_CLASS = 'visible';
/** Keep this far from the viewport edges while dragging. */
const EDGE_MARGIN = 10;

export function initNotes() {
  loadNotes();

  dom.notesBtn.addEventListener('click', toggleWidget);
  dom.notesCloseBtn.addEventListener('click', hideWidget);
  dom.notesTextarea.addEventListener('input', saveNotes);

  initDrag();
}

/* ---------- Visibility ---------- */

function toggleWidget() {
  const isVisible = dom.notesWidget.classList.contains(VISIBLE_CLASS);
  dom.notesWidget.classList.toggle(VISIBLE_CLASS, !isVisible);
}

function hideWidget() {
  dom.notesWidget.classList.remove(VISIBLE_CLASS);
}

/* ---------- Persistence ---------- */

function loadNotes() {
  dom.notesTextarea.value = localStorage.getItem(NOTES_STORAGE_KEY) ?? '';
}

function saveNotes() {
  localStorage.setItem(NOTES_STORAGE_KEY, dom.notesTextarea.value);
}

/* ---------- Dragging ---------- */

/**
 * Dragging uses pointer events so it works with touch and pen as well as
 * the mouse. The header captures the pointer, which keeps the move and
 * release events on the header itself - no document level listeners.
 */
function initDrag() {
  let activePointerId = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  dom.notesHeader.addEventListener('pointerdown', (event) => {
    // Let the close button handle its own clicks.
    if (dom.notesCloseBtn.contains(event.target)) return;
    if (event.button !== 0) return;

    activePointerId = event.pointerId;
    dom.notesHeader.setPointerCapture(activePointerId);

    const rect = dom.notesWidget.getBoundingClientRect();
    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;
  });

  dom.notesHeader.addEventListener('pointermove', (event) => {
    if (activePointerId !== event.pointerId) return;

    const maxX = window.innerWidth - dom.notesWidget.offsetWidth - EDGE_MARGIN;
    const maxY = window.innerHeight - dom.notesWidget.offsetHeight - EDGE_MARGIN;

    const newX = clamp(event.clientX - dragOffsetX, EDGE_MARGIN, maxX);
    const newY = clamp(event.clientY - dragOffsetY, EDGE_MARGIN, maxY);

    // right is reset once, the widget is then positioned by left/top only.
    dom.notesWidget.style.right = 'auto';
    dom.notesWidget.style.left = `${newX}px`;
    dom.notesWidget.style.top = `${newY}px`;
  });

  dom.notesHeader.addEventListener('pointerup', endDrag);
  dom.notesHeader.addEventListener('pointercancel', endDrag);

  function endDrag(event) {
    if (activePointerId !== event.pointerId) return;

    if (dom.notesHeader.hasPointerCapture(activePointerId)) {
      dom.notesHeader.releasePointerCapture(activePointerId);
    }
    activePointerId = null;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}
