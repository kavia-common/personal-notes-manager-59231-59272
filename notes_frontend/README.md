# Notes Frontend (Astro)

A simple, clean, and responsive Astro app to manage personal notes. It includes:
- Landing page listing notes with search, refresh, edit, and delete actions
- Create new note page
- Edit existing note page (with delete)
- Mock/stubbed REST API layer using localStorage, with easy switch to real backend
- Light/Dark theme toggle

## Quick start

1) Install dependencies
   npm install

2) Start dev server
   npm run dev

The app runs on http://localhost:3000 (configured in astro.config.mjs).

## Structure

- src/pages/index.astro: Notes list and actions
- src/pages/notes/[id].astro: Create/Edit note page; use "new" as id to create
- src/layouts/Layout.astro: Base HTML and theme styles
- src/components/ThemeToggle.astro: Light/Dark theme switch
- src/services/api.ts: API facade (live backend or localStorage mock)
- src/services/render.ts: Note card HTML renderer

## API integration

The API layer attempts to call a live backend if PUBLIC_API_BASE_URL is defined. Otherwise, it falls back to a localStorage mock.

Set the environment variable in an .env file at the project root:
  PUBLIC_API_BASE_URL=http://localhost:8080/api

Expected endpoints:
- GET    /notes
- GET    /notes/:id
- POST   /notes
- PUT    /notes/:id
- DELETE /notes/:id

All requests use JSON with Content-Type: application/json.

If not provided, the app seeds two demo notes in localStorage and operates fully client-side.

## Notes
- Public environment variables must start with PUBLIC_ to be accessible in client code.
- All operations handle basic errors and provide user feedback.
- UI favors accessibility with aria-* attributes and responsive layout.

## Scripts
- npm run dev: Start development server
- npm run build: Production build
- npm run preview: Preview built site
- npm run lint: Lint sources

ESLint is configured to ignore generated folders (.astro/ and dist/) via .eslintignore.
