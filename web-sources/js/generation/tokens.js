import { dom } from '../dom.js';
import { apiTokenize } from './api.js';
import { GENERATION_URL } from '../config.js';

export function initTokens() {
  let tokenizeTimeout = null;
  let negativeTokenizeTimeout = null;

  dom.promptInput.addEventListener('input', () => {
    clearTimeout(tokenizeTimeout);
    tokenizeTimeout = setTimeout(
      () => updateTokensForElement(dom.promptInput, dom.tokenCounter), 400
    );
  });

  dom.negativePromptInput.addEventListener('input', () => {
    clearTimeout(negativeTokenizeTimeout);
    negativeTokenizeTimeout = setTimeout(
      () => updateTokensForElement(dom.negativePromptInput, dom.negativeTokenCounter), 400
    );
  });

  // Protect prompts from overwriting
  dom.promptInput.addEventListener('keydown', () => {
    dom.promptInput.setAttribute('data-dirty', 'true');
  });
  dom.negativePromptInput.addEventListener('keydown', () => {
    dom.negativePromptInput.setAttribute('data-dirty', 'true');
  });

  dom.promptInput.addEventListener('input', () => {
    if (dom.promptInput.value.trim() === '') dom.promptInput.removeAttribute('data-dirty');
  });
  dom.negativePromptInput.addEventListener('input', () => {
    if (dom.negativePromptInput.value.trim() === '') dom.negativePromptInput.removeAttribute('data-dirty');
  });

}

async function updateTokensForElement(inputEl, counterEl) {
  const text = inputEl.value.trim();
  if (!text) {
    counterEl.textContent = 'Tokens: 0 / 77';
    counterEl.style.color = '#888';
    counterEl.style.opacity = '1.0';
    return;
  }

  counterEl.style.opacity = '0.4';
  const maxAttempts = 10;
  const delayMs = 500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await apiTokenize(text);

      if (response.ok) {
        const data = await response.json();
        const maxDisplay = data.max_length === 0 ? '∞' : data.max_length;
        counterEl.textContent = `Tokens: ${data.count} / ${maxDisplay}`;
        counterEl.style.color = (data.max_length !== 0 && data.count > data.max_length) ? '#c62828' : '#03dac6';
        counterEl.style.opacity = '1.0';
        return;
      } else {
        console.log(`Attempt ${attempt}/${maxAttempts}: HTTP ${response.status}`);
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    } catch (e) {
      console.log(`Tokenization attempt ${attempt}/${maxAttempts} failed. Backend is loading...`);
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  counterEl.textContent = 'Tokens: -- / -- (Backend unavailable)';
  counterEl.style.color = '#ffb300';
  counterEl.style.opacity = '1.0';
}
