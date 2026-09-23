# Webpack React Boilerplate

![React 19](https://img.shields.io/badge/React-19-20232a?logo=react)
![TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Webpack 5](https://img.shields.io/badge/Webpack-5-8dd6f9?logo=webpack&logoColor=black)
![Express 5](https://img.shields.io/badge/Express-5-000000?logo=express)

Шаблон фронтенд-приложения на React 19, TypeScript и Webpack 5 с Express-сервером для production-запуска.

## Быстрый старт

```bash
yarn install
yarn dev
```

Для production-сценария:

```bash
yarn build
yarn start
```

## Стек

- React 19
- TypeScript 5
- Webpack 5
- Babel
- Sass
- React Router 7
- Express 5

## Скрипты

Установка зависимостей:

```bash
yarn install
```

Запуск dev-сервера:

```bash
yarn dev
```

Приложение будет доступно по адресу `http://localhost:3000`.

Сборка production-версии:

```bash
yarn build
```

Готовый билд будет создан в папке `build/`.

Запуск production-сервера:

```bash
yarn start
```

Express-сервер раздает собранное приложение из `build/` и по умолчанию запускается на `http://localhost:5000`. Порт можно переопределить через переменную окружения `PORT`.

## Структура проекта

```text
.
|- app/
|  |- assets/
|  |- components/
|  |- constants/
|  |- hooks/
|  |- locale/
|  |- pages/
|  |- services/
|  |- utils/
|  |- App.tsx
|  |- globals.scss
|  `- index.tsx
|- public/
|  |- index.html
|  |- robots.txt
|  `- uploads/
|- index.js
|- package.json
|- tsconfig.json
|- vercel.json
`- webpack.config.js
```

## Точки входа

- `app/index.tsx`: инициализация фронтенда.
- `app/App.tsx`: конфигурация роутинга.
- `app/pages/Home.tsx`: пример страницы.
- `index.js`: Express-сервер для production и деплоя.

## Алиасы

Webpack резолвит импорты из `app/` через следующие алиасы:

- `components`
- `pages`
- `hooks`
- `services`
- `utils`
- `constants`
- `assets`
- `locale`

Пример:

```tsx
import { Layout } from 'components/ui/Layout';
import { Home } from 'pages/Home';
```

## Статические файлы

Файлы из `public/` используются как HTML-шаблон и копируются в итоговую сборку:

- `public/index.html`
- `public/favicon.ico`
- `public/apple-touch-icon.png`
- `public/robots.txt`
- `public/uploads/`

## Роутинг

Клиентский роутинг реализован через React Router и `createBrowserRouter`.

В production Express возвращает `build/index.html` для всех неподошедших маршрутов, поэтому прямой переход на вложенные URL работает корректно.

## Как добавить новую страницу

1. Создать компонент страницы в `app/pages/`, например `About.tsx`.
2. Подключить страницу в `app/App.tsx`.
3. Добавить новый маршрут в дерево `createRoutesFromElements`.

Пример:

```tsx
import { About } from 'pages/About';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path={'/'} element={<Layout />}>
      <Route index element={<Home />} />
      <Route path={'about'} element={<About />} />
    </Route>,
  ),
);
```

## Как работают алиасы

Алиасы настроены в Webpack через `resolve.alias`, чтобы избежать длинных относительных импортов вроде `../../../components/...`.

Вместо этого можно импортировать модули от корня `app/`:

```tsx
import { Layout } from 'components/ui/Layout';
import { Home } from 'pages/Home';
```

Это упрощает навигацию по проекту и уменьшает количество хрупких импортов при переносе файлов между папками.

## Деплой

В репозитории уже есть `vercel.json`, который направляет все запросы в `index.js`.

Типовой сценарий деплоя:

1. Установить зависимости.
2. Выполнить `yarn build`.
3. Запустить Node-сервер через `yarn start` или развернуть проект на Vercel.

## Примечания

- Webpack складывает JavaScript в `build/static/js/`.
- Стили выносятся в `build/static/css/`.
- Изображения и шрифты попадают в `build/static/media/`.
- В dev-сервере включен `historyApiFallback` для SPA-маршрутов.
