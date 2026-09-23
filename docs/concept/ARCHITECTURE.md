# Architecture

## Existing foundation in main

Текущий основной MVP уже имеет:

```text
React 19 + TypeScript + Webpack
            │
            │ /api/simulator
            ▼
Express 5 + TypeScript
            │
            ├── validation
            ├── deterministic scoring
            ├── docs/data-set.json
            └── OpenAI Responses API
```

Existing domain logic:

`apps/backend/features/simulator/service.ts`

Эту часть желательно переиспользовать, а не переписывать.

## Proposed isometric layer

### Preferred POC architecture

```text
React UI shell
   │
   ├── HUD / panels
   │
   └── Isometric renderer
          │
          ├── tiles
          ├── buildings
          ├── roads
          ├── vehicles
          └── ambient citizens
```

### Renderer

**PROPOSED, not yet implemented:**

Option A — PixiJS v8

Плюсы:
- удобный sprite renderer;
- camera/pan/zoom;
- много объектов;
- хорош для 2.5D tile map.

Option B — HTML Canvas 2D

Плюсы:
- меньше зависимостей;
- быстрее стартовать;
- достаточно для простого POC.

KISS choice: взять то, с чем разработчик быстрее даст первый экран.

## Data flow

```text
docs/data-set.json
      ↓
backend simulation service
      ↓
GET catalog / POST decisions
      ↓
scenario result
      ↓
React state
      ├── UI panels
      ├── district coloring
      ├── timeline animation
      └── isometric visual state
```

## Important separation

### Simulation state
Authoritative numbers:
- indicators;
- district scores;
- budget;
- effects;
- Score.

### Visual state
Presentation only:
- animation progress;
- car positions;
- citizen positions;
- smoke/trees;
- construction sprites.

Visual state **must not change Score** unless it is explicitly wired to a formal model.

## Timeline

Backend может вернуть final scenario result сразу.

Frontend проигрывает Q1–Q8 как deterministic visual timeline.

POC не обязан пересчитывать backend каждый кадр.

## Micro-model concept

Optional future layer:

```text
1,000,000 synthetic population
        ↓
aggregated cohorts
        ↓
1k–10k representative agents
        ↓
100–500 rendered agents
```

Это позволяет визуально говорить о «живом городе», не пытаясь рендерить миллион самостоятельных сущностей.

## Networking

Для текущего hackathon POC multiplayer не нужен.

### If multiplayer later

Предпочтительно:
- WebSocket;
- authoritative room/session server;
- horizontal sharding по independent simulation rooms.

WebRTC здесь не даёт ключевого преимущества и усложняет architecture.

## Scale claim

Не заявлять:

> supports 1M concurrent users

без load testing.

Допустимая формулировка концепта:

> architecture can evolve toward horizontally sharded simulation sessions.

А миллион можно использовать как **synthetic population model**, если такая модель реально будет реализована.

## Deployment

Current main — обычный frontend/backend web app.

Isometric renderer живёт на клиенте; scoring остаётся серверным.

Это сохраняет:
- воспроизводимость;
- серверную валидацию;
- контроль dataset;
- лёгкий frontend animation loop.
