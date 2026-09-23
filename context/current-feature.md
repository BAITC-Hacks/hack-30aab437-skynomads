# Current Feature

## Type
FEATURE

## Status
Verify

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
- 2026-09-23: пользователь выбрал визуальный стиль игрового городского dashboard для текущего MVP; вместо отсутствующего отдельного арта использовать явно условную схему районов CSS/SVG. Таймлайн, события, погода и остальные возможности референса не входят в эту задачу.

## Open Questions
- Live API call verified using a locally configured, Git-ignored backend `.env`; full browser walkthrough and independent clean launch remain to be checked.

## Implementation Plan
- [x] Implement and test deterministic dataset-backed validation and Score in `apps/backend/features/simulator/`; load runtime `apps/backend/db.json`, checked against canonical `docs/data-set.json`.
- [x] Add an Express API endpoint to serve catalog and evaluate five decisions; call OpenAI Responses API with calculated data and explicit configuration/API errors.
- [x] Replace scaffold home screen with a selection/results flow driven by the API.
- [x] Verify live OpenAI from the calculated API response and check invalid input; `.env.example` and README updated, valid/invalid API checks, tests, typecheck and build passed.
- [x] Переработать фронтенд в тёмный dashboard с условной картой районов, реальными мерами и бюджетом, сохранив существующий end-to-end выбор → Score → AI.
- [ ] Complete the UI walkthrough and independent clean run following README; capture observable evidence before sign-off.

## Verification Evidence
- `yarn workspace @react-app/backend test`: 7/7 pass (formula, lag/synergy/critical threshold, input rules, missing key, OpenAI request/response contract and full-to-runtime dataset consistency).
- `yarn typecheck`, `yarn build`: pass with current code.
- Local Express smoke: GET `/api/simulator` returns 14 measures, budget 100, baseline 52.56; empty POST returns HTTP 400; valid example POST returns cost 95, score 56.5431, M10 + M12 synergy and an explicit no-key AI error.
- Webpack development server and `/api` proxy loaded in a headless Edge browser; desktop 1365px and narrow 500px screenshots inspected. 390px screenshot is clipped by headless Edge's effective viewport minimum; true 390px layout remains NOT VERIFIED.
- Live AI response: PASS with user's local ignored `apps/backend/.env`. On isolated port 7311, invalid POST returned HTTP 400; example POST returned HTTP 200, cost 95, Score 56.5431, synergy M10 + M12, and non-empty AI text with no `analysisError`. An existing user-owned Node listener on port 7000 was left untouched.
- Review of the first live explanation revealed unsupported district attribution; after tightening the model input to backend-computed strongest/weakest districts, regional measure counts and per-measure effects, a new live example on isolated port 7317 returned an explanation referring to Нура as both most improved and still weakest, M10 + M12 synergy, three районные меры в Нуре, одну в Сарыарке, and the citywide measure affecting all districts. No key was printed.
- Final updated code: 7/7 backend tests, `yarn typecheck`, `yarn build` PASS. No full interactive UI/clean-clone acceptance evidence yet.
- Редизайн по согласованному референсу: первая сцена с пятью метками районов, фильтруемым каталогом, выбором для плана, бюджетом и блоком реального результата. Headless Edge screenshots 1440px desktop и 500px narrow inspected; нижние метки на 500px скорректированы и повторно осмотрены. `yarn typecheck`, `yarn build`, 7/7 backend tests PASS после визуальных изменений. Полный интерактивный проход и отдельная проверка ширины 390px пока NOT VERIFIED.

## Notes
- Детализация карты по прототипу: более низкая жилая застройка и выделенный высотный центр; отдельные окна на четырёх фасадах, крыши и оборудование, терракотовые скатные крыши, арочные мосты с подвесами, ряды деревьев на берегах, автомобили и водная рябь. Центральная башня получила изогнутые опоры и площадь; стадион освобождён от пересекавшихся зданий. Проверены новые рендеры Edge 1440×960 и 500×844; typecheck и build PASS (прежнее предупреждение о размере Three.js-бандла остаётся, vendors ~930 KiB). Это стилизованная процедурная интерпретация, не пиксельная копия референса.
- По запросу пользователя SVG-схема заменена процедурной Three.js-сценой (`cityScene.ts`): объёмные здания, река, мосты, деревья, центральная башня; OrbitControls и проецируемые HTML-метки районов. Desktop рендер осмотрен в headless Edge (1440×960), typecheck/build PASS. Сборка предупреждает о размере vendors.js (~915 KiB). Интерактивное вращение и узкий экран новой сцены ещё не проверены.
- Starting from clean worktree at commit `1d3a1dd`. Earlier DOC-1 conversion archived at `history/features/DOC-1-document-conversion.md`.
- Output Score is displayed with two decimals (56.54 for the demo); calculations retain full precision. README describes data access and isolated deployment limitation.
- `docs/data-set.md` — человекочитаемая копия полного `docs/data-set.json`; по новому запросу пользователя backend переключён на `apps/backend/db.json` с только необходимыми полями. JSON в `docs/` остаётся исходным для синхронизации, а тест контролирует точное совпадение рабочей проекции.
- После переключения на `db.json`: `yarn workspace @react-app/backend test` (7/7), `yarn typecheck`, `yarn build` — PASS; GET `/api/simulator` в запущенном backend возвращает бюджет 100, пять районов, 14 мероприятий и базовый Score 52.56. Конфигурация отдельного Vercel backend включает `db.json`.
