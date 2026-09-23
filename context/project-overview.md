# Project Overview

## Product

Hackathon team repository for SKYNOMADS (`README.md`). Selected track in `docs/PRD.md`: «Аким на 5 часов», an AI simulator of urban management decisions for conditional districts of Astana. `docs/data-set.json` describes synthetic district indicators, initiatives, constraints, and score calculation. One vertical MVP spec and its implementation spec were approved for split (`current-prd.md`).

## Users

The track describes a city manager, analyst, or simulator user (`docs/PRD.md`).

## Current Stack

Copied `react-app` boilerplate: Node.js >=22, Yarn Classic 1.x workspaces; React 19 + TypeScript + Webpack 5 frontend; Express 5 + TypeScript backend (versions from manifests, not deployed state).

## Architecture

`apps/frontend/app/pages/Home.tsx` is the React/SCSS scenario screen; `apps/frontend/app/features/simulator/api.ts` calls `/api/simulator` via Webpack's `/api` proxy. `apps/backend/features/simulator/` validates input, loads the canonical JSON dataset, calculates the Score and requests an OpenAI explanation. Existing auth/blog/media features belong to the copied scaffold, not the scenario.

## Repository Map

- `README.md` — repository identity, scaffold status and local setup commands.
- `package.json`, `yarn.lock` — Yarn workspace scripts and locked dependencies.
- `apps/frontend/`, `apps/backend/` — copied SPA/API boilerplate, including sample features and per-app READMEs.
- `docs/PRD.md` — reviewed track PRD and evaluation criteria.
- `docs/data-set.json` — structured synthetic dataset and scoring rules.
- `docs/product-brief.md`, `current-prd.md`, `docs/specs/` — product documentation workflow and approved split.
- `.agents/skills/`, `.agents/templates/`, `.agents/scripts/` — copied Devtools toolkit.
- `.gitignore` — ignores `.agents/`.
- `context/`, `build-plan.md`, `history/` — project operating state.

## Reusable Building Blocks

React router/layout and Express routers/middleware provide entry points. `apps/backend/features/simulator/service.ts` is the canonical simulator validator/calculator.

## Commands

- Dev: `yarn start` (runs root `dev:frontend` and `dev:backend` scripts).
- Test: `yarn workspace @react-app/backend test` (six simulator domain/AI contract tests passed).
- Typecheck: `yarn typecheck` (passed after frozen lockfile install).
- Lint: UNKNOWN — no lint script in copied manifests.
- Build: `yarn build` (passed after frozen lockfile install).
- Verify: `yarn typecheck` and `yarn build` are the currently applicable checks; no dedicated Verify script exists.

## Current State

Repository includes source and per-app Vercel configuration but no deployed environment or CI workflow was found. Simulator implementation exists locally, with passing tests/build and API smoke checks; live OpenAI response and clean-clone UI walkthrough are not yet verified. Original ODT files were removed in team commit `1d3a1dd` after conversion.

## Current Milestone

UNKNOWN — no approved build plan yet.

## Constraints

- Follow the user-provided hackathon playbook at `C:\Users\baau\Documents\hackalem-playbook.md`: prioritize one real end-to-end MVP, reproducible setup, honest documentation, and clear input/API error handling.
- The PRD requires five decisions within its five available directions, a shared virtual budget, automatic budget validation, a computed Quality of Life Score, and AI explanation (`docs/PRD.md`).
- The synthetic dataset specifies deterministic scoring and validation; the LLM explains calculated results rather than calculating or inventing numbers (`docs/data-set.json`).

## Known Risks

- The actual OpenAI response cannot be checked until a key is provided locally; current environment has none.
- Backend reads `docs/data-set.json` relative to the backend workspace working directory. An isolated backend deployment would need that file bundled or a data-path adjustment.
- A real AI-response check requires an available OpenAI API key; model responses cannot be verified without one.
- `.agents/` is ignored by Git, so a clean clone will not contain the Devtools toolkit unless provisioned separately.
- The hackathon playbook is outside the repository and will not be included in a clean clone.

## Important Decisions

See `context/decisions.md` for five-decision, scaffold, OpenAI API and display-precision decisions.
