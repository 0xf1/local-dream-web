import { dom } from '../dom.js';
import {
  downloadSessionFile,
  loadSessionFromFile,
} from '../persistence/sessionFileIO.js';

/**
* Attaches event handlers to the session save/load buttons.
* Called once from main.js → init().
*/
export function initSessionControls() {
  // --- Show dialog ---
  dom.saveSessionShowDialog.addEventListener('click', () => {
    if (dom.saveSessionDialog) {
      dom.saveSessionDialog.style.display = 'flex';
    }
  });

  // --- Cancel dialog ---
  dom.saveSessionCancelBtn.addEventListener('click', () => {
    if (dom.saveSessionDialog) {
      dom.saveSessionDialog.style.display = 'none'; // Hide the modal
    }
  });

  // --- Close by clicking on the dark area around the window ---
  if (dom.saveSessionDialog) {
    dom.saveSessionDialog.addEventListener('click', (event) => {
      if (event.target === dom.saveSessionDialog) {
        dom.saveSessionDialog.style.display = 'none';
      }
    });
  }

  // --- Save ---
  dom.saveSessionSaveBtn.addEventListener('click', () => {
    try {

      /** @type {import('../types.jsdoc.js').SessionSaveOptions} */
      const options = {
        model: dom.saveSessionModel?.checked ?? false,
        prompt: dom.saveSessionPrompt?.checked ?? false,
        img2img: dom.saveSessionImg2Img?.checked ?? false,
        denoiseStrength: dom.saveSessionDenoiseStrength?.checked ?? false,
        advancedGenParams: dom.saveSessionAdvancedGenerationParams?.checked ?? false,
      };

      downloadSessionFile(options);

      if (dom.saveSessionDialog) {
        dom.saveSessionDialog.style.display = 'none';
      }
    } catch (e) {
      console.error('[sessionControls] save failed:', e);
      alert('Failed to save session: ' + e.message);
    }
  });

  // --- Load (two-step: button → file dialog → reading) ---
  dom.loadSessionBtn.addEventListener('click', () => {
    dom.loadSessionFile.click();
  });

  dom.loadSessionFile.addEventListener('change', async (e) => {
    const file = dom.loadSessionFile.files?.[0];
    if (!file) return;

    try {
      await loadSessionFromFile(file);
    } catch (e) {
      console.error('[sessionControls] load failed:', e);
      alert('Failed to load session: ' + e.message);
    } finally {
      dom.loadSessionFile.value = '';
    }
  });

}
