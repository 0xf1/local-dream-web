import { dom } from '../dom.js';
import {
  apiGetFileList,
  apiReadFile,
  apiCreateFile,
  apiUpdateFile,
  apiDeleteFile,
} from './api.js';

const VISIBLE_CLASS = 'visible';
const EDGE_MARGIN = 10;

let currentFile = null;

export function initNotes() {
  loadFileList();

  dom.notesBtn.addEventListener('click', toggleWidget);
  dom.notesCloseBtn.addEventListener('click', hideWidget);
  if (dom.notesAddBtn) {
    dom.notesAddBtn.addEventListener('click', showEditor);
  } else {
    console.warn('notesAddBtn not found in DOM');
  }
  dom.notesSaveBtn.addEventListener('click', saveCurrentFile);
  dom.notesBackBtn.addEventListener('click', goBackToList);

  initDrag();
}

function toggleWidget() {
  const isVisible = dom.notesWidget.classList.contains(VISIBLE_CLASS);
  dom.notesWidget.classList.toggle(VISIBLE_CLASS, !isVisible);
  if (!isVisible) {
    goBackToList();
  }
}

function hideWidget() {
  goBackToList();
  dom.notesWidget.classList.remove(VISIBLE_CLASS);
}

async function loadFileList() {
  try {
    const files = await apiGetFileList();
    dom.notesFileList.innerHTML = '';
    if (files.length === 0) {
      dom.notesFileList.style.display = 'none';
      dom.notesEmptyState.style.display = 'block';
    } else {
      dom.notesFileList.style.display = 'block';
      dom.notesEmptyState.style.display = 'none';
      files.forEach(filename => {
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
        dom.notesFileList.appendChild(fileItem);
      });
    }
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

async function openFile(filename) {
  try {
    const content = await apiReadFile(filename);
    currentFile = filename;
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

async function createNewFile() {
  const filename = dom.notesFilename.value.trim();
  if (!filename) {
    alert('Please enter a file name.');
    return;
  }
  const content = dom.notesTextarea.value;
  try {
    await apiCreateFile(filename, content);
    currentFile = filename;
    goBackToList();
  } catch (error) {
    console.error('Error creating file:', error);
    alert('Error creating file: ' + error.message);
  }
}

function showEditor() {
  currentFile = null;
  dom.notesFilename.value = '';
  dom.notesTextarea.value = '';
  dom.notesFileList.style.display = 'none';
  dom.notesEmptyState.style.display = 'none';
  dom.notesEditor.style.display = 'block';
  dom.notesAddBtn.style.display = 'none';
}

async function saveCurrentFile() {
  const filename = dom.notesFilename.value.trim();
  if (!filename) {
    alert('Please enter a file name.');
    return;
  }
  const content = dom.notesTextarea.value;
  try {
    if (currentFile === null) {
      await apiCreateFile(filename, content);
    } else {
      await apiUpdateFile(filename, content);
    }
    currentFile = filename;
    goBackToList();
  } catch (error) {
    console.error('Error saving file:', error);
    alert('Error saving file: ' + error.message);
  }
}

async function deleteFile(filename) {
  try {
    await apiDeleteFile(filename);
    if (currentFile === filename) {
      goBackToList();
    } else {
      loadFileList();
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    alert('Error deleting file: ' + error.message);
  }
}

function goBackToList() {
  currentFile = null;
  dom.notesFilename.value = '';
  dom.notesTextarea.value = '';
  dom.notesEditor.style.display = 'none';
  dom.notesAddBtn.style.display = 'block';
  loadFileList();
}

/* ---------- Dragging ---------- */

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

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}
