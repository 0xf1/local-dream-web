import { pad } from '../utils/misc.js';
import { buildSessionSnapshot } from './sessionSerializer.js';
import { restoreSessionFromSnapshot } from './sessionRestorer.js';

/**
 * File: Save / Load
 * @param {import('../types.jsdoc.js').SessionSaveOptions} options
 */
export function downloadSessionFile(options) {
  const snapshot = buildSessionSnapshot(options);
  if (!snapshot) {
    alert('Nothing to save');
    return;
  }
  const blob = new Blob([JSON.stringify(snapshot)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  a.href = url;
  a.download = `session-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function loadSessionFromFile(file) {
  const text = await file.text();
  const snapshot = JSON.parse(text);
  await restoreSessionFromSnapshot(snapshot);
}
