/**
 * Notes File List Module — manages the file list.
 */

import { dom } from '../dom.js';
import { apiGetFileList, apiDeleteFile } from './api.js';
import { getCurrentFile, goBackToList } from './widget.js';
import { openFile } from './editor.js';

/**
 * Loads the file list and updates the UI.
 * @returns {Promise<void>}
 */
export async function loadFileList() {
  try {
    const files = await apiGetFileList();
    dom.notesFileList.innerHTML = '';
    if (files.length === 0) {
      toggleEmptyState(true);
    } else {
      toggleEmptyState(false);
      files.forEach(filename => {
        const fileItem = createFileItem(filename);
        dom.notesFileList.appendChild(fileItem);
      });
    }
    const currentFile = getCurrentFile();
    if (currentFile) {
      const exists = files.includes(currentFile);
      if (!exists) {
        goBackToList();
      }
    }
  } catch (error) {
    console.error('Error loading files:', error);
  }
}

/**
 * Toggles the empty state display.
 * @param {boolean} isEmpty
 * @returns {void}
 */
export function toggleEmptyState(isEmpty) {
  if (isEmpty) {
    dom.notesFileList.style.display = 'none';
    dom.notesEmptyState.style.display = 'block';
  } else {
    dom.notesFileList.style.display = 'block';
    dom.notesEmptyState.style.display = 'none';
  }
}

/**
 * Creates a DOM element for a file item in the list.
 * @param {string} filename
 * @returns {HTMLDivElement}
 */
export function createFileItem(filename) {
  const fileItem = document.createElement('div');
  fileItem.className = 'notes-file-item';

  const fileNameSpan = document.createElement('span');
  fileNameSpan.className = 'notes-file-name';
  fileNameSpan.textContent = filename;
  fileNameSpan.addEventListener('click', () => openFile(filename));

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'notes-file-delete';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteFile(filename);
  });

  fileItem.appendChild(fileNameSpan);
  fileItem.appendChild(deleteBtn);

  return fileItem;
}

/**
 * Deletes a file.
 * @param {string} filename
 * @returns {Promise<void>}
 */
async function deleteFile(filename) {
  try {
    await apiDeleteFile(filename);
    if (getCurrentFile() === filename) {
      goBackToList();
    } else {
      loadFileList();
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    alert('Error deleting file: ' + error.message);
  }
}

