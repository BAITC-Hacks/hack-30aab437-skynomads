# Project Overview

## Product

Hackathon team repository for SKYNOMADS (`README.md`). Selected track in `docs/PRD.md`: «Аким на 5 часов», an AI simulator of urban management decisions for conditional districts of Astana. `docs/data-set.json` describes synthetic district indicators, initiatives, constraints, and score calculation. One vertical MVP spec and its implementation spec were approved for split (`current-prd.md`).

## Users

The track describes a city manager, analyst, or simulator user (`docs/PRD.md`).

## Current Stack

Copied `react-app` boilerplate: Node.js >=22, Yarn Classic 1.x workspaces; React 19 + TypeScript + Webpack 5 frontend; Express 5 + TypeScript backend (versions from manifests, not deployed state).

## Architecture

`apps/frontend/app/pages/Home.tsx` is a dark React/SCSS simulator dashboard. `apps/frontend/app/features/simulator/CityMap.tsx` mounts a procedural Three.js city from `cityScene.ts`, with instanced buildings/windows/trees, river, bridges and projected district labels. `apps/frontend/app/features/simulator/api.ts` calls `/api/simulator` via Webpack's `/api` proxy. `apps/backend/features/simulator/` validates input, loads the minimal `apps/backend/db.json` dataset, calculates the Score and requests an OpenAI explanation. The full source dataset remains in `docs/data-set.json`. Existing auth/blog/media features belong to the copied scaffold, not the scenario.

## Repository Map

- `README.md` — repository identity, scaffold status and local setup commands.
- `package.json`, `yarn.lock` — Yarn workspace scripts and locked dependencies.
- `apps/frontend/`, `apps/backend/` — copied SPA/API boilerplate, including sample features and per-app READMEs.
- `apps/frontend/public/initiatives/` — 14 user-provided PNG illustrations and optimized WebP thumbnails; Webpack bundles these local assets for the catalog.
- `CharacterPortrait.tsx` (simulator feature) — user-provided mayor/advisor portraits with local optimized WebP and PNG fallback. `WarningToast.tsx` — dismissible, timed warnings hosted inside the active native dialog or document body.
- `apps/frontend/app/shared/assets/fonts/` — local Outfit WOFF2 for Latin/numerals and Inter WOFF2 for Cyrillic; UI weights 300/400/500, SIL OFL license included.
- `apps/frontend/app/features/simulator/ScenarioDashboard.tsx` — real direction averages, Score ring/legend and before/after chart; `InitiativeThumbnail.tsx` — local thumbnail loading with fallback to original PNG.
- `apps/frontend/app/features/simulator/mapInitiatives.ts`, `cityHighlights.ts` — current choices mapped to illustrative district sites and a disposable Three.js highlight layer; citywide measures appear in all five districts. `CityMap.tsx` projects interactive measure badges without recreating the scene.
- `docs/PRD.md` — reviewed track PRD and evaluation criteria.
- `docs/data-set.json` — structured synthetic dataset and scoring rules.
- `docs/data-set.md` — human-readable tables and explanation of the full source dataset.
- `apps/backend/db.json` — runtime-only projection of the source dataset; a backend test checks it against `docs/data-set.json`.
- `docs/product-brief.md`, `current-prd.md`, `docs/specs/` — product documentation workflow and approved split.
- `.agents/skills/`, `.agents/templates/`, `.agents/scripts/` — copied Devtools toolkit.
- `.gitignore` — ignores `.agents/`.
- `context/`, `build-plan.md`, `history/` — project operating state.

## Reusable Building Blocks

React router/layout and Express routers/middleware provide entry points. `apps/backend/features/simulator/service.ts` is the canonical simulator validator/calculator.

## Commands

- Dev: `yarn start` (runs root `dev:frontend` and `dev:backend` scripts, localhost:3000 + :7000).
- Built app: `yarn serve` after build (Express serves SPA + API on localhost:7000).
- Test: `yarn test` (10 domain/AI/data-consistency/HTTP tests passed).
- Typecheck: `yarn typecheck` (passed after frozen lockfile install).
- Lint: UNKNOWN — no lint script in copied manifests.
- Build: `yarn build` (passed after frozen lockfile install).
- Verify: `yarn verify` (tests → typecheck → build).
- Smoke: `yarn smoke` (built app, no paid call); `yarn smoke --live` (one real OpenAI request).

## Current State

Submission preparation is recorded in `docs/submission.md`: tests/typechecks/build, clean-directory dependency installation, built-app browser walkthrough and live OpenAI response passed. Sample auth/blog/media routes are no longer mounted; their source remains. No public deployment or CI is claimed. Independent teammate confirmation and final publication remain pending. Original ODT files were removed in team commit `1d3a1dd` after conversion.

## Current Milestone

Hackathon MVP submission verification; see `build-plan.md` and `docs/submission.md`.

## Constraints

- Follow the user-provided hackathon playbook at `C:\Users\baau\Documents\hackalem-playbook.md`: prioritize one real end-to-end MVP, reproducible setup, honest documentation, and clear input/API error handling.
- The PRD requires five decisions within its five available directions, a shared virtual budget, automatic budget validation, a computed Quality of Life Score, and AI explanation (`docs/PRD.md`).
- The synthetic dataset specifies deterministic scoring and validation; the LLM explains calculated results rather than calculating or inventing numbers (`docs/data-set.json`).

## Known Risks

- Independent clean launch by another participant is not yet evidenced. Full interactive demo was verified in the current worktree.
- Backend loads `db.json` relative to the backend workspace working directory; run through workspace scripts or ensure this working directory in deployment. Backend Vercel config includes `db.json` in bundled files.
- Real OpenAI responses require a locally configured API key in `apps/backend/.env`; the key is excluded from Git. The live API response was observed without logging the key.
- `.agents/` is ignored by Git, so a clean clone will not contain the Devtools toolkit unless provisioned separately.
- The hackathon playbook is outside the repository and will not be included in a clean clone.

## Important Decisions

See `context/decisions.md` for five-decision, scaffold, OpenAI API and display-precision decisions.
