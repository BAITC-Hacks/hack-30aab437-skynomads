# Backend — Аким на 5 часов

Express 5 / TypeScript, ESM. `features/simulator/` отвечает за валидацию, расчёт и реальный OpenAI-вызов; `db.json` — рабочие данные. БД и миграции не требуются.

Из **корня монорепозитория**:

```bash
yarn install --frozen-lockfile
yarn start
```

Или `yarn verify` и затем `yarn serve` для локальной демонстрации готовой сборки на http://localhost:7000.
Все workspace-команды устанавливают рабочий каталог backend, необходимый для `db.json` и `.env`.

## Контракт

- `GET /api/simulator` — бюджет, районы, определения показателей, каталог, базовый Score.
- `POST /api/simulator` — `{ "decisions": [пять объектов { "measureId", "district" }] }`.
- HTTP 400 — невалидный набор или JSON; HTTP 413 — слишком большой запрос; HTTP 429 — лимит частоты.
- HTTP 200 для валидного набора содержит Score, изменения районов, `analysis` и `analysisError`. При недоступном AI Score сохраняется, `analysis = null`, причина явно указана.
- Шаблонные `/api/auth`, `/api/blog`, `/media` отключены и возвращают 404. Их исходники не являются частью MVP API.

Конфигурация: `.env` по `.env.example`, `OPENAI_API_KEY`, `PORT`, `NODE_ENV`. JWT/SMTP для симулятора не нужны.
Подробнее: [README](../../README.md), [сдача и проверка](../../docs/submission.md).
