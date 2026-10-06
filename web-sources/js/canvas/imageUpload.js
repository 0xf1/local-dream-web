import { dom } from '../dom.js';
import { state } from '../state.js';
import { updateBrushCursorSize } from './magnifier.js';
import { resetEditorState, loadImageIntoEditor } from '../editor/editorState.js';

export function initImageUpload() {
  dom.uploadImgBtn.addEventListener('click', () => dom.img2imgFile.click());
  dom.img2imgFile.addEventListener('change', onFileChange);
  dom.clearImgBtn.addEventListener('click', onClearImage);

  dom.uploadRefImgBtn.addEventListener('click', () => dom.img2imgRefFile.click());
  dom.img2imgRefFile.addEventListener('change', onRefFileChange);
}

function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      loadImageIntoEditor(img);
      setTimeout(updateBrushCursorSize, 50);
    };
    img.src = (/** @type {string} */ (event.target.result));
  };
  reader.readAsDataURL(file);
}

function onClearImage() {
  dom.img2imgFile.value = '';
  resetEditorState();

  dom.canvasWorkspace.style.display = 'none';
  dom.clearImgBtn.style.display = 'none';
  if (state.activeModel?.isDit) {
    dom.uploadImgBtn.textContent = 'Select base image';
  } else {
    dom.uploadImgBtn.textContent = 'Select image';
  }
}

function onRefFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const w = 100;
      const h = 100;

      const canv = document.createElement('canvas');
      canv.width = w;
      canv.height = h;
      const cctx = canv.getContext('2d', { willReadFrequently: true });

      cctx.fillStyle = '#000';
      cctx.fillRect(0, 0, w, h);

      const scale = Math.min(w / img.width, h / img.height);
      const newWidth = img.width * scale;
      const newHeight = img.height * scale;
      const x = (w - newWidth) / 2;
      const y = (h - newHeight) / 2;

      cctx.drawImage(img, x, y, newWidth, newHeight);

      // Delete button
      const btnSize = 20;
      const btnX = w - btnSize;
      const btnY = 0;

      cctx.fillStyle = '#fff';
      cctx.fillRect(btnX, btnY, btnSize, btnSize);

      cctx.strokeStyle = '#f00';
      cctx.lineWidth = 2;
      cctx.beginPath();
      cctx.moveTo(btnX + 4, btnY + 4);
      cctx.lineTo(btnX + btnSize - 4, btnY + btnSize - 4);
      cctx.moveTo(btnX + btnSize - 4, btnY + 4);
      cctx.lineTo(btnX + 4, btnY + btnSize - 4);
      cctx.stroke();

      if (!state.refImages) state.refImages = [];

      const imageRecord = {
        canvas: canv,
        imageObject: img
      };

      state.refImages.push(imageRecord);

      // Delete button handler
      canv.addEventListener('click', (clickEvent) => {
        const rect = canv.getBoundingClientRect();
        const clickX = clickEvent.clientX - rect.left;
        const clickY = clickEvent.clientY - rect.top;

        if (clickX >= btnX && clickX <= w && clickY >= btnY && clickY <= btnSize) {
          canv.remove();
          state.refImages = state.refImages.filter(item => item.canvas !== canv);
        }
      });

      dom.refImages.appendChild(canv);
    };
    img.src = (/** @type {string} */ (event.target.result));
  };
  reader.readAsDataURL(file);
}
