/**
 * Notes UI Module — initialization and orchestration of all sub-modules.
 */

import { dom } from '../dom.js';
import { toggleWidget, hideWidget, goBackToList } from './widget.js';
import { loadFileList } from './file-list.js';
import { showEditor, saveCurrentFile } from './editor.js';

const EDGE_MARGIN = 10;

/**
 * Initializes the notes module.
 */
export function initNotes() {
  loadFileList();

  dom.notesBtn.addEventListener('click', handleNotesBtn);
  dom.notesCloseBtn.addEventListener('click', hideWidget);
  if (dom.notesAddBtn) {
    dom.notesAddBtn.addEventListener('click', showEditor);
  } else {
    console.warn('notesAddBtn not found in DOM');
  }
  dom.notesSaveBtn.addEventListener('click', saveCurrentFile);
  dom.notesBackBtn.addEventListener('click', handleBackBtn);

  initDrag();
}

/**
 * Handles the notes button click.
 */
function handleNotesBtn() {
  toggleWidget();
  loadFileList();
}

/**
 * Handles the back button click — calls goBackToList and loadFileList.
 */
function handleBackBtn() {
  goBackToList();
  loadFileList();
}


/* ---------- Dragging ---------- */

/**
 * Initializes widget dragging.
 * @returns {void}
 */
function initDrag() {
  let activePointerId = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  dom.notesHeader.addEventListener('pointerdown', (event) => {
    if (dom.notesCloseBtn.contains(event.target) || dom.notesAddBtn.contains(event.target)) return;
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

/**
 * Clamps a value between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}


