# Current Feature

## Type
FEATURE

## Status
In Progress

## Source
`docs/specs/001-city-scenario-feature.md` and `docs/specs/001-city-scenario-implementation.md`, approved split of `docs/PRD.md` (SHA-256 `8bf43c4c9a6e37ba10e4e1b14951bb0382c1f96b8125af41311e4f387cea8ee5`). Dataset: `docs/data-set.json`.

## Goals
One real end-to-end scenario: five choices → deterministic validation and Score → real OpenAI explanation → reproducible demo.

## Scope
`R-01`–`R-07`, `AC-01`–`AC-05` from the approved feature spec.

## Non-Goals
Optional comparison, events, presentations, and product extensions.

## Acceptance Criteria
- `AC-01`: shared budget 100; example cost 95 accepted, overbudget refused.
- `AC-02`: five valid choices incl. district assignments accepted; invalid inputs explain why.
- `AC-03`: deterministic baseline 52.56 and example approximately 56.5431 before display rounding; synergies, lag, thresholds and changes work.
- `AC-04`: OpenAI explanation from computed data; explicit error on missing key or API failure, no fake result.
- `AC-05`: clean launch and error check reproducible from README.

## Decisions
- React/Express scaffold and dataset already exist. User selected OpenAI API; use `gpt-4o-mini` via Responses API on the server, no added SDK needed. Display Score with two decimals; calculation remains full precision.

## Open Questions
- Live API verification depends on a locally configured OpenAI key; do not save or print it.

## Implementation Plan
- [x] Implement and test deterministic dataset-backed validation and Score in `apps/backend/features/simulator/`; load canonical `docs/data-set.json` from the backend workspace.
- [x] Add an Express API endpoint to serve catalog and evaluate five decisions; call OpenAI Responses API with calculated data and explicit configuration/API errors.
- [x] Replace scaffold home screen with a selection/results flow driven by the API.
- [ ] Finish live OpenAI and full UI verification after local key is supplied; `.env.example` and README updated, valid/invalid API smoke checks, tests, typecheck and build passed.

## Verification Evidence
- `yarn workspace @react-app/backend test`: 6/6 pass (formula, lag/synergy/critical threshold, input rules, missing key and OpenAI request/response contract).
- `yarn typecheck`, `yarn build`: pass with current code.
- Local Express smoke: GET `/api/simulator` returns 14 measures, budget 100, baseline 52.56; empty POST returns HTTP 400; valid example POST returns cost 95, score 56.5431, M10 + M12 synergy and an explicit no-key AI error.
- Webpack development server and `/api` proxy loaded in a headless Edge browser; desktop 1365px and narrow 500px screenshots inspected. 390px screenshot is clipped by headless Edge's effective viewport minimum; true 390px layout remains NOT VERIFIED.
- Live AI response: NOT VERIFIED (no `OPENAI_API_KEY` configured in current environment); no AI output fabricated.

## Notes
- Starting from clean worktree at commit `1d3a1dd`. Earlier DOC-1 conversion archived at `history/features/DOC-1-document-conversion.md`.
- Output Score is displayed with two decimals (56.54 for the demo); calculations retain full precision. README describes data access and isolated deployment limitation.
