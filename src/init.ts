/**
 * CRITICAL: This script runs BEFORE React mounts
 * It prevents Figma's share-modal.js from crashing the app
 */

// Suppress all errors from share-modal.js
window.addEventListener('error', (event: ErrorEvent) => {
  if (event.filename && event.filename.includes('share-modal')) {
    console.warn('⚠️ share-modal.js error suppressed (init.ts)');
    event.preventDefault();
    event.stopImmediatePropagation();
    return false;
  }
  
  if (event.message && event.message.includes("Cannot read properties of null")) {
    console.warn('⚠️ Null reference error suppressed (init.ts):', event.message);
    event.preventDefault();
    event.stopImmediatePropagation();
    return false;
  }
}, true);

// Create dummy elements that Figma scripts might be looking for
const createDummyElements = () => {
  const ids = [
    'figma-share-button',
    'share-button',
    'figma-modal-trigger',
    'share-modal-trigger'
  ];
  
  ids.forEach(id => {
    if (!document.getElementById(id)) {
      const el = document.createElement('div');
      el.id = id;
      el.style.display = 'none';
      document.body.appendChild(el);
    }
  });
};

// Run immediately if DOM is ready, otherwise wait
if (document.body) {
  createDummyElements();
} else {
  document.addEventListener('DOMContentLoaded', createDummyElements);
}

console.log('✅ Init script loaded - Figma error protection active');
