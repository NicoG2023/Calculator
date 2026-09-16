# Calculator Frontend

React + TypeScript frontend for the full-stack calculator.

The complete project documentation, architecture, API reference, Docker instructions, testing strategy, and design decisions are available in the [root README](../README.md).

## Development

```bash
npm ci
npm run dev
```

By default the frontend calls the backend at `http://localhost:8080`. Override it when needed with `VITE_API_BASE_URL`.

## Quality checks

```bash
npm run lint
npm test
npm run test:coverage
npm run build
```
