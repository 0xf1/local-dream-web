/**
 * Notes API module — all HTTP requests to the backend.
 * Pure functions that return responses or throw on errors.
 */

/**
 * Fetch the list of note files.
 * @returns {Promise<string[]>} Array of filenames.
 */
export async function apiGetFileList() {
  const response = await fetch('/api/notes');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.files;
}

/**
 * Read the content of a note file.
 * @param {string} filename
 * @returns {Promise<string>} File content.
 */
export async function apiReadFile(filename) {
  const response = await fetch('/api/notes/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.content;
}

/**
 * Create or overwrite a note file.
 * @param {string} filename
 * @param {string} content
 * @returns {Promise<void>}
 */
export async function apiCreateFile(filename, content) {
  const response = await fetch('/api/notes/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, content }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error);
}

/**
 * Update an existing note file (overwrite).
 * @param {string} filename
 * @param {string} content
 * @returns {Promise<void>}
 */
export async function apiUpdateFile(filename, content) {
  const response = await fetch('/api/notes/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, content, overwrite: true }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error);
}

/**
 * Delete a note file.
 * @param {string} filename
 * @returns {Promise<void>}
 */
export async function apiDeleteFile(filename) {
  const response = await fetch('/api/notes/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error);
}
