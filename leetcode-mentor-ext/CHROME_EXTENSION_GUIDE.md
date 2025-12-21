# Chrome Extension Guide: LeetCode Mentor

This guide is for React developers building the "LeetCode Mentor" extension. It explains the unique architecture required to inject a React app into an existing website (LeetCode) and interact with its internal state (Monaco Editor).

---

## 1. High-Level Architecture

Unlike a traditional React app, this extension lives in multiple "isolated worlds":

| Component | Technology | Role | Access |
| :--- | :--- | :--- | :--- |
| **Content Script** | React + Vite | The main UI overlay. Runs isolated from the page's JS variables. | DOM Access, Limited Chrome API. |
| **Inject Script** | Vanilla JS | A bridge to access LeetCode's internals (Monaco Editor). | **Full Window Object Access**. No Chrome API. |
| **Shadow DOM** | Web API | Encapsulates our styles so they don't break LeetCode (and vice versa). | Style Isolation. |

### The "Bridge" Pattern
We need to read code from the Monaco Editor, which is a global variable (`window.monaco`) on LeetCode.
*   **Problem**: Content Scripts *cannot* see variables defined by the page (security feature).
*   **Solution**: We inject a script (`src/inject.js`) into the page. This script reads `window.monaco` and dispatches standard DOM events (`CustomEvent`) that our React app listens for.

---

## 2. Project Structure

```bash
src/
├── App.tsx             # Main Logic & State Machine
├── content.tsx         # Entry Point (Mounts React to Shadow DOM)
├── inject.js           # The "Bridge" script
├── index.css           # Tailwind CSS
├── types.ts            # Shared TypeScript definitions
└── components/         # UI Components
    ├── Header.tsx      # Popup Header
    ├── ActiveView.tsx  # Main Chat/Hint Interface
    ├── IdleView.tsx    # "Start Session" Screen
    ├── ...             # Other atomic views
```

---

## 3. Key Technical Concepts

### A. The Shadow DOM Root (`src/content.tsx`)
Instead of mounting to `#root` in a blank HTML file, we create a new div, attach a **Shadow Root**, and mount React inside it.

**Why?**
*   **Style Protection**: LeetCode's global CSS (bootstraps, resets) won't mess up our UI.
*   **Tailwind Isolation**: Our Tailwind classes won't leak out to color the rest of LeetCode.

```typescript
// src/content.tsx
const root = document.createElement('div');
document.body.append(root);
const shadow = root.attachShadow({ mode: 'open' }); // The firewall
ReactDOM.createRoot(shadow).render(<App />);
```

### B. The Injection Bridge (`src/inject.js`)
This script is loaded by `content.tsx` as a script tag. It runs in the *same context* as LeetCode's own JavaScript.

1.  **Reads**: `window.monaco.editor.getModels()`
2.  **Sends**: `window.dispatchEvent(new CustomEvent('PROBLEM_UPDATED', ...))`
3.  **App Listens**: `src/App.tsx` has a `window.addEventListener('PROBLEM_UPDATED', ...)`

### C. State Machine (`src/App.tsx`)
The app isn't just a static page; it's a state machine:
*   `idle`: Waiting for the user to start.
*   `starting`: Connecting (simulated).
*   `active`: Monitoring changes and giving hints.

---

## 4. Development Workflow

This project uses **Vite** + **@crxjs/vite-plugin** for a modern developer experience (HMR).

### Setup & Run
1.  `npm install`
2.  `npm run dev` (Keeps watching for changes)
3.  Open Chrome → `chrome://extensions`
4.  Enable **Developer Mode**
5.  **Load Unpacked** → Select the `dist/` folder created by Vite.

### How to Iterate
*   **UI Changes**: Edit `App.tsx` or components. HMR usually updates the UI without a reload.
*   **Logic Changes**: If you edit `inject.js`, you usually need to refresh the LeetCode page.
*   **Manifest Changes**: If you edit `manifest.json`, you must reload the extension in `chrome://extensions`.

---

## 5. Troubleshooting Common Issues

### "Extension context invalidated"
*   **Cause**: You updated the extension code, but the old content script is still running on the open LeetCode tab.
*   **Fix**: Refresh the LeetCode web page.

### "Styles look broken"
*   **Cause**: We are in Shadow DOM. Some global styles (like `html/body` font-family) might not pass through.
*   **Fix**: Explicitly set font-family and resets in `src/index.css` or the top-level container in `App.tsx`.

### "Cannot find Monaco"
*   **Cause**: The `inject.js` script ran before LeetCode finished loading Monaco.
*   **Fix**: The script currently uses intervals to poll for the editor presence. Check the console logs for "[LeetCode Mentor]" messages.

---

## 6. Building for Production

```bash
npm run build
```
This generates a production-ready `dist/` folder. This is what you would zip and upload to the Chrome Web Store.
