/**
 * Notes Editor Module — manages the note editor.
 */

import { dom } from '../dom.js';
import { apiReadFile, apiCreateFile, apiUpdateFile } from './api.js';
import { getCurrentFile, setCurrentFile, goBackToList } from './widget.js';
import { loadFileList } from './file-list.js';

/**
 * Opens an existing file in the editor.
 * @param {string} filename
 * @returns {Promise<void>}
 */
export async function openFile(filename) {
  try {
    const content = await apiReadFile(filename);
    setCurrentFile(filename);
    dom.notesFilename.value = filename;
    dom.notesTextarea.value = content;
    dom.notesFileList.style.display = 'none';
    dom.notesEmptyState.style.display = 'none';
    dom.notesEditor.style.display = 'block';
    dom.notesAddBtn.style.display = 'none';
  } catch (error) {
    console.error('Error opening file:', error);
    alert('Error opening file: ' + error.message);
  }
}

/**
 * Shows an empty editor for creating a new file.
 * @returns {void}
 */
export function showEditor() {
  setCurrentFile(null);
  dom.notesFilename.value = '';
  dom.notesTextarea.value = '';
  dom.notesFileList.style.display = 'none';
  dom.notesEmptyState.style.display = 'none';
  dom.notesEditor.style.display = 'block';
  dom.notesAddBtn.style.display = 'none';
}

/**
 * Saves the current file (create or update).
 * @returns {Promise<void>}
 */
export async function saveCurrentFile() {
  const filename = dom.notesFilename.value.trim();
  if (!filename) {
    alert('Please enter a file name.');
    return;
  }
  const content = dom.notesTextarea.value;
  try {
    const currentFile = getCurrentFile();
    if (currentFile === null) {
      await apiCreateFile(filename, content);
    } else {
      await apiUpdateFile(filename, content);
    }
    setCurrentFile(filename);
    goBackToList();
    await loadFileList();
  } catch (error) {
    console.error('Error saving file:', error);
    alert('Error saving file: ' + error.message);
  }
}

/**
 * Creates a new file.
 * @returns {Promise<void>}
 */
export async function createNewFile() {
  const filename = dom.notesFilename.value.trim();
  if (!filename) {
    alert('Please enter a file name.');
    return;
  }
  const content = dom.notesTextarea.value;
  try {
    await apiCreateFile(filename, content);
    setCurrentFile(filename);
    goBackToList();
    await loadFileList();
  } catch (error) {
    console.error('Error creating file:', error);
    alert('Error creating file: ' + error.message);
  }
}

