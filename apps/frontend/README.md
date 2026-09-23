# Frontend — Аким на 5 часов

React 19 / TypeScript / Webpack 5 / SCSS / Three.js. Работайте из **корня монорепозитория**:

```bash
yarn install --frozen-lockfile
yarn start
```

Интерфейс: http://localhost:3000, прокси `/api` → backend на 7000.
`yarn verify` проверяет весь проект; `yarn serve` после сборки обслуживает UI и API на 7000.
Отдельный `apps/frontend/index.js` — статический сервер шаблона без API-прокси, не рекомендуемый путь демо.

- `app/pages/Home.tsx` — сценарий выбора и диалоги.
- `app/features/simulator/` — HTTP-клиент, карта/подсветка, показатели, изображения и тосты.
- `app/shared/` — роуты, layout, локальные шрифты.
- `public/initiatives/` — изображения команды; `optimized/` — WebP-миниатюры.

Точная установка, `.env`, демо-ввод и ограничения: [корневой README](../../README.md).
Никакие ключи не нужны и не должны попадать в frontend.
