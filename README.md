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
