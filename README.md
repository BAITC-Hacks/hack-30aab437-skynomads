# hack-30aab437-skynomads
Hackathon team repository for SKYNOMADS

## Текущий статус

В репозиторий перенесён стартовый React + Express boilerplate. Городской симулятор из `docs/PRD.md` ещё не реализован; данные и будущий MVP описаны в `docs/data-set.json` и `docs/specs/`.

## Запуск бойлерплейта

Нужны Node.js 22+ и Yarn Classic (1.x). Из корня репозитория:

```bash
yarn install --frozen-lockfile
yarn start
```

`yarn start` запускает фронтенд на `http://localhost:3000` и API на `http://localhost:7000`; запросы к `/api` проксируются на API. Для проверки сборки: `yarn typecheck` и `yarn build`.

Для демонстрационных auth-эндпоинтов при необходимости скопируйте `apps/backend/.env.example` в `apps/backend/.env` и задайте собственный `JWT_SECRET`. Не добавляйте `.env` в Git. Для стартовой страницы конфигурация не нужна.

Шаблонные модули авторизации, блога и медиа не являются реализованным сценарием хакатона.
