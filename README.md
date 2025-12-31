# Download and Install (Manual)

- Download latest ZIP: https://github.com/Devansh-ops/Google-AI-Partner-Catalyst/releases/latest/download/leetcode-mentor-latest.zip
- Landing page (auto-updated): https://devansh-ops.github.io/Google-AI-Partner-Catalyst/

Install (Chrome/Edge):
1. Unzip the downloaded file.
2. Open chrome://extensions (Edge: edge://extensions).
3. Enable Developer mode.
4. Click "Load unpacked" and select the unzipped folder (contains manifest.json).
5. Open a LeetCode problem page and use the extension.

Release process (CI auto-builds and uploads ZIPs on tags):
1. Optional: bump version in frontend/vite.config.ts (manifest).
2. Tag and push:
   git tag vX.Y.Z
   git push origin vX.Y.Z
3. Artifacts:
   - versioned: leetcode-mentor-vX.Y.Z.zip
   - stable: leetcode-mentor-latest.zip (used by the landing page)

# Project Setup

## Backend Setup

To start the backend:

1. Create a `.env` file and a `vertex-ai-key.json` file in the `backend` folder
2. Run the following command to start the backend in Docker:
```bash
   docker-compose up -d --build
```

The basic backend is now functional.

## Frontend Setup

A simple frontend is available in the `test-frontend` directory.

To run it:

1. Navigate to the `test-frontend` directory:
```bash
   cd test-frontend
```

2. Start the HTTP server:
```bash
   python -m http.server 3000
```

3. Open your browser and navigate to:
```
   http://localhost:3000/test.html
```
