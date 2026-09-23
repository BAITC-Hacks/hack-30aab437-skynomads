# Express App

Feature-based TypeScript + Express API with JWT auth, blog CRUD, media upload, and Vercel serverless deployment.

## Features

- JWT auth: register, login, profile.
- Blog CRUD endpoints.
- `GET /api/blog` cache via `apicache` (5 minutes) with invalidation on write routes.
- Media upload/delete endpoints.
- Feature-based architecture: `features/*` + `shared/*`.
- Vercel-ready serverless entrypoint (`api/index.ts`).

## Tech Stack

- Node.js
- TypeScript (NodeNext / ESM)
- Express 5
- express-validator
- apicache
- multer
- jsonwebtoken

## Project Structure

```text
api/
  index.ts

features/
  auth/
  blog/
  media/
  index.ts

shared/
  middleware/
  services/
  errors/
  index.ts

models/
  user/model.json
  blog/model.json
  media/model.json

public/
server.ts
vercel.json
```

## Quick Start

```bash
yarn install
yarn dev
```

Default local URL: `http://localhost:7001`.

## Environment Variables

Supported files:

- `config/config.env` (loaded first if present)
- `.env` (loaded after)

Minimum required:

```env
JWT_SECRET=your_long_random_secret
```

Optional:

```env
PORT=7001
NODE_ENV=development
JWT_EXPIRE=30d

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_EMAIL=user@example.com
SMTP_PASSWORD=your_password
```

Notes:

- SMTP variables are only needed for `POST /api/blog/sendmail`.
- If SMTP is not used, do not set `SMTP_*` variables.
- `PORT` is used locally; Vercel manages ports automatically.

## Scripts

- `yarn dev` - run dev server with `tsx watch`.
- `yarn build` - compile TypeScript into `dist`.
- `yarn typecheck` - type-check without emitting files.
- `yarn start` - run built server from `dist/server.js`.

## API

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile` (protected)

### Blog

- `GET /api/blog`
- `POST /api/blog/create` (protected)
- `PUT /api/blog/:id` (protected)
- `DELETE /api/blog/:id` (protected)
- `POST /api/blog/sendmail`

### Media

- `POST /media` (protected, form field: `docs`)
- `DELETE /media/:filename` (protected)

## Authorization Header

```http
Authorization: Bearer <token>
```

## Data Storage

Project uses JSON file storage:

- `models/user/model.json`
- `models/blog/model.json`
- `models/media/model.json`

Uploaded files are stored in `public/uploads/media`.

## Vercel Deployment

This project is configured for Vercel serverless:

- `api/index.ts` exports the Express app.
- `server.ts` skips `app.listen(...)` when `process.env.VERCEL` is set.
- `vercel.json` rewrites routes to `/api` and includes runtime files with `functions.includeFiles`.

Deployment checklist:

1. Set `JWT_SECRET` in Vercel Environment Variables.
2. Keep build command as `yarn build`.
3. Redeploy without cache if runtime config changed.
