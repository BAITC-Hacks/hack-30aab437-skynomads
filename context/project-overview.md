# Project Overview

## Product

Hackathon team repository for SKYNOMADS (`README.md`). Selected track in `docs/PRD.md`: «Аким на 5 часов», an AI simulator of urban management decisions for conditional districts of Astana. `docs/data-set.json` describes synthetic district indicators, initiatives, constraints, and score calculation. One vertical MVP spec and its implementation spec were approved for split (`current-prd.md`).

## Users

The track describes a city manager, analyst, or simulator user (`docs/PRD.md`).

## Current Stack

Copied `react-app` boilerplate: Node.js >=22, Yarn Classic 1.x workspaces; React 19 + TypeScript + Webpack 5 frontend; Express 5 + TypeScript backend (versions from manifests, not deployed state).

## Architecture

Scaffold: `apps/frontend/app/` is a React SPA with router and SCSS; `apps/backend/` is an Express API with sample auth/blog/media features and JSON model files. Webpack development server proxies `/api` to the backend. Simulator scoring/AI logic is not implemented.

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

Existing React router/layout and Express routers/middleware provide scaffold entry points; no reusable city-simulator domain logic yet.

## Commands

- Dev: `yarn start` (runs root `dev:frontend` and `dev:backend` scripts).
- Test: UNKNOWN — no test script in copied manifests.
- Typecheck: `yarn typecheck` (passed after frozen lockfile install).
- Lint: UNKNOWN — no lint script in copied manifests.
- Build: `yarn build` (passed after frozen lockfile install).
- Verify: `yarn typecheck` and `yarn build` are the currently applicable checks; no dedicated Verify script exists.

## Current State

Repository now includes copied source and per-app Vercel configuration but no deployed environment or CI workflow was found. Documentation conversion remains the recorded active work item in `context/current-feature.md` (Verify). The original ODT files appear deleted in the working tree; do not treat that as an authorized cleanup.

## Current Milestone

UNKNOWN — no approved build plan yet.

## Constraints

- Follow the user-provided hackathon playbook at `C:\Users\baau\Documents\hackalem-playbook.md`: prioritize one real end-to-end MVP, reproducible setup, honest documentation, and clear input/API error handling.
- The PRD requires five decisions within its five available directions, a shared virtual budget, automatic budget validation, a computed Quality of Life Score, and AI explanation (`docs/PRD.md`).
- The synthetic dataset specifies deterministic scoring and validation; the LLM explains calculated results rather than calculating or inventing numbers (`docs/data-set.json`).

## Known Risks

- The copied scaffold builds and typechecks but does not yet implement the hackathon scenario; no clean-clone end-to-end MVP check is possible.
- Implementation specs leave stack, AI provider and score display rounding unresolved before coding.
- `.agents/` is ignored by Git, so a clean clone will not contain the Devtools toolkit unless provisioned separately.
- The hackathon playbook is outside the repository and will not be included in a clean clone.

## Important Decisions

See `context/decisions.md` for the confirmed interpretation of the five-decision rule. No stack decision recorded.
