# Decisions

- Пользователь уточнил визуальное решение: вместо SVG-схемы построить процедурный 3D-город на Three.js по референсу. Это заменяет прежний выбор CSS/SVG для карты; функциональный объём симулятора сохраняется.

Record only confirmed decisions. Include date/revision, decision, rationale, scope, and superseded decision when applicable.

- 2026-09-23 — For the hackathon MVP, exactly five decisions may span at least three of the five available directions, with at most two in any one direction. The user chose the rules of `docs/data-set.json` over an interpretation requiring one decision in each direction. Applies to the PRD and future specs; this preserves the dataset's valid demonstration scenario.
- 2026-09-23 — The user requested copying the local `C:\Users\baau\Documents\GitHub\react-app` boilerplate into this repository. This establishes a React/TypeScript/Webpack frontend and Express/TypeScript backend scaffold; it does not decide the AI provider or make the existing demo auth/blog/media modules MVP requirements. Source-generated outputs, source `.env.production`, and repository metadata are excluded.
- 2026-09-23 — The user selected OpenAI API for real AI analysis of computed scenarios. For the hackathon use the documented Responses HTTP API with server-side `OPENAI_API_KEY` and the small `gpt-4o-mini` model; no API key is sent to the frontend. Show Score with two decimal places, retaining full precision for calculation (example 56.5431 → 56.54 displayed).
- 2026-09-23 — Пользователь одобрил визуальный язык референса для существующего MVP без расширения функциональности. Поскольку отдельного арта города нет, карта будет условной схемой CSS/SVG с пятью реальными баллами районов. Таймлайн, события и вымышленные индикаторы из референса не добавляются.
- 2026-09-23 — По запросу пользователя выбранные инициативы визуализируются на процедурной 3D-карте: районная мера только в назначенном районе, городская во всех пяти; позиции условные. Подсветка означает «В плане», не готовое строительство и не изменение Score до расчёта. Неназначенные меры не получают фиктивного района.
