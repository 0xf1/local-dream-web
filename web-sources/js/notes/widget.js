/**
 * Notes Widget Module — manages widget visibility and position.
 */

import { dom } from '../dom.js';

const VISIBLE_CLASS = 'visible';

let currentFile = null;

/**
 * Toggles the visibility of the notes widget.
 * @returns {void}
 */
export function toggleWidget() {
  const isVisible = dom.notesWidget.classList.contains(VISIBLE_CLASS);
  dom.notesWidget.classList.toggle(VISIBLE_CLASS, !isVisible);
  if (!isVisible) {
    goBackToList();
  }
}

/**
 * Hides the notes widget.
 * @returns {void}
 */
export function hideWidget() {
  goBackToList();
  dom.notesWidget.classList.remove(VISIBLE_CLASS);
}

/**
 * Goes back to the file list view (resets the editor).
 * @returns {void}
 */
export function goBackToList() {
  currentFile = null;
  dom.notesFilename.value = '';
  dom.notesTextarea.value = '';
  dom.notesEditor.style.display = 'none';
  dom.notesAddBtn.style.display = 'block';
}

/**
 * Returns the currently open file.
 * @returns {string|null}
 */
export function getCurrentFile() {
  return currentFile;
}

/**
 * Sets the currently open file.
 * @param {string|null} filename
 * @returns {void}
 */
export function setCurrentFile(filename) {
  currentFile = filename;
}

/**
 * Returns the widget visibility state.
 * @returns {boolean}
 */
export function isWidgetVisible() {
  return dom.notesWidget.classList.contains(VISIBLE_CLASS);
}


