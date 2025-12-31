# 🖥️ LeetCode Mentor - Frontend

The frontend is a **Chrome Extension** built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**. It injects a rich, interactive overlay into LeetCode problem pages to provide real-time AI mentoring.

## ⚡️ Key Features

- **Isolated UI**: Uses **Shadow DOM** to prevent CSS conflicts with LeetCode's existing styles.
- **Monaco Editor Integration**: A custom "Injection Bridge" allows reading code directly from LeetCode's editor instance.
- **Hot Module Replacement (HMR)**: Full HMR support for rapid development, even inside a Chrome Extension.
- **Modern Stack**: React 18, Framer Motion for animations, and Lucide React for icons.

## 🛠 Project Structure

```bash
src/
├── App.tsx             # Main Application State Machine & Logic
├── content.tsx         # Content Script (React Mount Point)
├── inject.js           # Bridge script to access Window objects
├── components/         # Reusable UI Components
│   ├── ActiveView.tsx  # Main chat/hint interface
│   ├── Header.tsx      # Draggable header
│   └── ...
├── hooks/              # Custom hooks (useDomEvent, etc.)
└── index.css           # Tailwind + Global Styles
```

## 🏗 Architecture Details

### 1. The Shadow DOM Barrier
To ensure our "premium" UI doesn't look like a generic bootstrap modal, and to prevent LeetCode's styles from breaking our layout, we mount our entire React app inside a Shadow Root.

```tsx
// src/content.tsx
const root = document.createElement('div');
const shadow = root.attachShadow({ mode: 'open' }); // Styles stop here
ReactDOM.createRoot(shadow).render(<App />);
```

### 2. The Injection Bridge (`inject.js`)
Chrome extensions (Content Scripts) cannot access JavaScript variables on the parent page (like `window.monaco`). To get the user's code, we inject a script tag into the page's `<head>`.

1. `inject.js` runs in the page context.
2. It hooks into `window.monaco` to listen for changes.
3. It dispatches a `CustomEvent` ('CODE_CHANGE') to the `window` object.
4. Our React App (`content.tsx`) listens for this event and updates state.

## 🚀 Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Dev Server**
   ```bash
   npm run dev
   ```
   *This will run Vite in watch mode and output to `dist/`.*

3. **Load in Chrome**
   - Go to `chrome://extensions`
   - Enable **Developer Mode**
   - Click **Load Unpacked**
   - Select the `frontend/dist` directory

4. **Iterate**
   - **UI Changes**: HMR will auto-update the extension (mostly).
   - **Manifest/Script Changes**: You may need to refresh the extension on the `chrome://extensions` page and reload the LeetCode tab.

## 📦 Building for Production

To create a production-ready build (minified, optimized):

```bash
npm run build
```

This will generate the artifacts in `dist/` which can be zipped and published to the Chrome Web Store.
