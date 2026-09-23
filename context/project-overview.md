# Project Overview

## Product

Hackathon team repository for SKYNOMADS (`README.md`). Preliminary selected track in `docs/PRD.odt`: «Аким на 5 часов», an AI simulator of urban management decisions for conditional districts of Astana. `docs/data-set.odt` describes synthetic district indicators, initiatives, constraints, and score calculation. Product scope is not yet approved as a spec split.

## Users

The preliminary track describes a city manager, analyst, or simulator user (`docs/PRD.odt`).

## Current Stack

UNKNOWN — no application manifest, runtime configuration, or source code is present.

## Architecture

UNKNOWN — no application has been scaffolded. The track documents a desired calculation and AI explanation, not implemented components.

## Repository Map

- `README.md` — repository identity only.
- `docs/PRD.odt` — preliminary selected track and evaluation criteria.
- `docs/data-set.odt` — synthetic data and scoring rules for the track.
- `docs/PRD.md` — text-format conversion of the preliminary track.
- `docs/data-set.json` — structured conversion of the synthetic dataset and its rules.
- `.agents/skills/`, `.agents/templates/`, `.agents/scripts/` — copied Devtools toolkit.
- `.gitignore` — ignores `.agents/`.
- `context/`, `build-plan.md`, `history/` — project operating state.

## Reusable Building Blocks

UNKNOWN — no application code yet.

## Commands

- Dev: UNKNOWN
- Test: UNKNOWN
- Typecheck: UNKNOWN
- Lint: UNKNOWN
- Build: UNKNOWN
- Verify: UNKNOWN

## Current State

Repository has README, local `docs/`, and local `.agents/` (ignored by `.gitignore`); no application, tests, CI workflow, deployment config, or approved spec split was found. No active work item is established.

## Current Milestone

UNKNOWN — no approved build plan yet.

## Constraints

- Follow the user-provided hackathon playbook at `C:\Users\baau\Documents\hackalem-playbook.md`: prioritize one real end-to-end MVP, reproducible setup, honest documentation, and clear input/API error handling.
- The preliminary track requires five decisions across its directions, a shared virtual budget, automatic budget validation, a computed Quality of Life Score, and AI explanation (`docs/PRD.odt`).
- The synthetic dataset specifies deterministic scoring and validation; the LLM explains calculated results rather than calculating or inventing numbers (`docs/data-set.odt`).

## Known Risks

- No runtime, scaffold, or verify command is available yet; clean-start reproducibility cannot be tested.
- The preliminary PRD has not been split into approved implementation specs.
- `.agents/` is ignored by Git, so a clean clone will not contain the Devtools toolkit unless provisioned separately.
- The hackathon playbook is outside the repository and will not be included in a clean clone.

## Important Decisions

See `context/decisions.md`. No confirmed implementation decisions recorded.
