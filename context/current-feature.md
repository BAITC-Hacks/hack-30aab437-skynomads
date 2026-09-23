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
- OpenAI key is configured locally in the ignored root `.env`; do not save or print it.

## Implementation Plan
- [x] Implement and test deterministic dataset-backed validation and Score in `apps/backend/features/simulator/`; load canonical `docs/data-set.json` from the backend workspace.
- [x] Add an Express API endpoint to serve catalog and evaluate five decisions; call OpenAI Responses API with calculated data and explicit configuration/API errors.
- [x] Replace scaffold home screen with a selection/results flow driven by the API.
- [ ] Finish narrow-screen and manual UI walkthrough; desktop map selection, reference five-decision scenario, API result and AI panel were verified in headless Chrome. `.env.example`, README, tests, typecheck and build are updated.
- [x] First isometric concept iteration: SVG city map with five selectable districts, pan/zoom, visual sites for chosen district measures, dataset-backed layers, HUD, initiative selection and 5-decision plan; server scenario response drives final KPIs and AI panel. Q1–Q8 is a visual timeline, not a new simulation model.

## Verification Evidence
- `yarn workspace @react-app/backend test`: 6/6 pass (formula, lag/synergy/critical threshold, input rules, missing key and OpenAI request/response contract).
- `yarn typecheck`, `yarn build`: pass with current code.
- Local Express smoke: GET `/api/simulator` returns 14 measures, budget 100, baseline 52.56; empty POST returns HTTP 400; valid example POST returns cost 95, score 56.5431, M10 + M12 synergy and an explicit no-key AI error.
- Webpack development server and `/api` proxy loaded in a headless Edge browser; desktop 1365px and narrow 500px screenshots inspected. 390px screenshot is clipped by headless Edge's effective viewport minimum; true 390px layout remains NOT VERIFIED.
- Live AI response: VERIFIED locally with a single reference scenario POST through webpack proxy (HTTP 200; score 56.5431; nonempty AI analysis; `analysisError: null`). The key and generated response were not printed or saved.
- Isometric concept iteration: existing simulator tests and typecheck/build pass; local GET and reference POST through webpack proxy return the dataset-backed 56.5431 result and explicit missing-key AI status. Local port moved from 7000 (occupied by AirTunes on macOS) to 7001. Integrated browser connection was unavailable; later desktop walkthrough used headless Chrome CDP (see PixiJS map pass below).
- UI polish: full-viewport isometric map, one `ASTANA AKIM5` brand, floating left decision drawer, compact layer switcher and floating result; backend scoring remains authoritative.
- Docker dev loop: `docker compose up -d --build dev` starts a persistent Node 22 container with repo bind-mounted and `node_modules` in a named volume. Host CSS edit produced a Webpack HMR update; host backend source edit triggered `tsx watch` restart. Frontend/catalog returned HTTP 200 through exposed ports; typecheck, 6 backend tests, and build passed inside the running container.
- Simulation visual pass: Q1–Q8 begins on submit instead of waiting for OpenAI; each selected district initiative has an individual site, and its visual completion is tied to catalog `lagQuarters`. Moving traffic and citywide visual pulses run during playback. Baseline KPIs remain displayed until both Q8 and the authoritative API result are available; if AI is slow, the UI waits without inventing intermediate numbers. Container typecheck, 6 simulator tests and build passed.
- Game-like drawer pass: initiative dropdown replaced by category-filtered cards; district picked via chips or map. Five-step mission indicator and bottom-pinned checkout show animated spent/remaining budget and progress. Isometric tile field expanded beyond the viewport; the former oval island was removed. Headless Chrome DOM smoke, container typecheck, 6 backend tests and production build passed.
- PixiJS map pass: replaced SVG DOM tiles with a PixiJS v8 WebGL canvas, a small set of generated reusable textures, camera pan/zoom, visibility culling, denser buildings, animated transport and initiative sites. Selected district remains in color while others are desaturated; initial state and the map reset button show the whole city in color. Headless Chrome WebGL screenshot and CDP checks verified canvas mount, click-to-select, reference plan cost 95/remaining 5 and Q1–Q8 result 52.56 → 56.54 with AI panel.
- Drawer/recommendations polish: district control pinned above the scrolling inventory; selecting an initiative adds it immediately when the district is known, while citywide measures add without assignment. Checkout is a single pinned budget/remaining/start button; brand sits next to QoL on the right; long names wrap. OpenAI prompt now requests grounded scenario-improvement recommendations, displayed as formatted Markdown. Headless Chrome CDP verified M7/Нура → cost 24, M8 → 44, citywide M12 → 58, example cost 95/remaining 5, final score 56.54 and live AI recommendations. Narrow viewport 500×900: drawer checkout remains visible, brand/QoL do not overlap, inventory scrolls. Container typecheck, 6 backend tests and build pass.
- Budget-filter pass: initiatives costing more than remaining budget are hidden from the current category. Empty-state copy appears when no measures fit; removing a decision reveals newly affordable measures again. Verified in headless Chrome with reference plan remaining 5 (no cards) and after removing M5 remaining 30 (M3 cost 30 visible); container typecheck and build pass.
- District selector refinement: always-visible single-row horizontal strip has «Обзор» and five districts. «Обзор» is a map view, not a district assignment: district-scoped measures are visibly muted and disabled with a selection hint; citywide measures remain clickable. Chosen and unaffordable measures are removed from the available catalog, so no remaining enabled-looking dead cards. Headless Chrome CDP verified overview M1 disabled/M2 enabled, citywide M2 auto-added, Nura enabled M1, selected measures vanished, and overview disabled district measures again. Docker typecheck/build/tests passed.

## Notes
- Starting from clean worktree at commit `1d3a1dd`. Earlier DOC-1 conversion archived at `history/features/DOC-1-document-conversion.md`.
- Output Score is displayed with two decimals (56.54 for the demo); calculations retain full precision. README describes data access and isolated deployment limitation.
