import { CONTROL_URL, GENERATION_URL } from '../config.js';

export async function apiSelectModel(modelId, width = 512, height = 512) {
  return fetch(`${CONTROL_URL}/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model_id: modelId, width, height }),
  });
}

export async function apiStopGeneration(modelId) {
  return fetch(`${CONTROL_URL}/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model_id: modelId }),
  });
}

export async function apiGenerate(payload) {
  return fetch(`${GENERATION_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiTokenize(prompt) {
  return fetch(`${GENERATION_URL}/tokenize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
}

export async function apiGetCatalog() {
  const res = await fetch(`${CONTROL_URL}/models`);
  if (!res.ok) throw new Error('Catalog fetch failed');
  return res.json();
}

export async function apiGetStatus() {
  const res = await fetch(`${CONTROL_URL}/status`);
  if (!res.ok) throw new Error('Status fetch failed');
  return res.json();
}
