# Slide AI — Copilot Instructions

This project is a Tauri 2.x desktop application for AI-assisted courseware learning.

## Project Conventions

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend**: Tauri 2.x (Rust) with Python sidecar for document processing
- **State Management**: Zustand
- **Markdown Rendering**: react-markdown + remark-gfm + rehype-katex

## Key Files

- `src/types/index.ts` — All TypeScript interfaces and defaults
- `src/stores/` — Zustand stores (documentStore, settingsStore, chatStore)
- `src/services/llm.ts` — Multi-provider LLM API client with SSE streaming
- `src/services/explainService.ts` — Explanation generation + pre-generation queue
- `src/services/rag.ts` — RAG full-document Q&A with fallback keyword search
- `src-tauri/src/commands/` — Tauri Rust commands
- `src-tauri/sidecar/` — Python document processor

## Development

```bash
npm run dev         # Frontend only
npm run tauri:dev   # Full Tauri app
npm run tauri:build # Production build
```
