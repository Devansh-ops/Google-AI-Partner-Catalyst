import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import styles from './index.css?inline';
import toastStyles from 'react-toastify/dist/ReactToastify.css?inline';

// 1. Inject the Monaco helper
console.log('[LeetCode Mentor] Content script loaded');

try {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  script.onload = () => console.log('[LeetCode Mentor] Inject script loaded successfully');
  script.onerror = (e) => console.error('[LeetCode Mentor] Failed to load inject script:', e);
  (document.head || document.documentElement).appendChild(script);
} catch (error) {
  console.error('[LeetCode Mentor] Extension context invalidated. Please reload the page.', error);
}

// 2. Create the UI Container with Shadow DOM
const root = document.createElement('div');
root.id = 'gemini-mentor-root';
// Make sure our root container doesn't block interactions on the page initially
root.style.position = 'fixed';
root.style.top = '0';
root.style.left = '0';
root.style.width = '100%';
root.style.height = '100%';
root.style.pointerEvents = 'none'; // Let clicks pass through by default
root.style.zIndex = '999999';
document.body.append(root);

const shadow = root.attachShadow({ mode: 'open' });
const container = document.createElement('div');
// Determine if we need to reset inherited styles.
// Usually shadow DOM creates a boundary, but some properties inherit (color, font).
// We'll set a basic reset on the container.
container.style.all = 'initial';
shadow.appendChild(container);

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles + '\n' + toastStyles;
shadow.appendChild(styleSheet);

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);