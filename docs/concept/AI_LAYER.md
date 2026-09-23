# AI Layer

## Principle

AI — **аналитик результата**, а не simulation engine.

```text
User decisions
    ↓
Validation
    ↓
Deterministic simulation
    ↓
Calculated JSON
    ↓
LLM explanation
```

## Current implementation

В текущем `main` используется:

- OpenAI Responses API;
- server-side API key;
- model: `gpt-4o-mini`;
- AI получает уже рассчитанный scenario result;
- Score доступен даже если AI API недоступен.

Эту границу нужно сохранить.

## Core AI output

После Q8 AI формирует:

### 1. Сильные стороны
Какие направления и районы улучшились.

### 2. Риски
Какие показатели всё ещё критичны или ухудшились.

### 3. Компромиссы
Например:
- сильный транспортный эффект;
- но большая доля бюджета;
- слабая соцсфера осталась нерешённой.

### 4. Альтернативный ход
Без утверждения «это лучший вариант».

Формулировка:

> Если целью является уменьшение разрыва между районами, можно рассмотреть перенос части бюджета...

## AI City Council — optional concept

Game-like presentation одного analysis можно разложить на несколько ролей:

- 🚍 Transport Planner
- 🌳 Ecologist
- 🏫 Social Planner
- 🛡 Safety Officer
- 🏗 Utilities / Services

Это может быть:
- один LLM call с role-based sections;
- либо несколько агентов позднее.

Для хакатона предпочтительнее **один call**, чтобы не увеличивать latency и complexity.

## Pre-decision advisor

Optional:

Перед подтверждением меры AI может обратить внимание на dataset-backed context:

> Есиль уже имеет E1=68, а Сарыарка E1=42. Вы всё равно хотите строить парк в Есиле?

Это рекомендация, не запрет.

## Synthetic citizen narratives

Можно генерировать короткие реплики от synthetic residents, но только на основе рассчитанных показателей.

Допустимо:

> «В Нуре улучшилась доступность школ.»

Недопустимо без отдельной модели:

> «Теперь 8 432 ребёнка получили место.»

## Guardrails

AI prompt должен явно требовать:

- использовать только переданные числа;
- не рассчитывать Score заново;
- не придумывать статистику;
- не выдавать synthetic data за официальный прогноз;
- кратко объяснять cause → effect;
- отделять факт модели от рекомендации.

## Failure mode

Если OpenAI API недоступен:

- simulation остаётся рабочей;
- Score показывается;
- UI сообщает, что AI explanation недоступно;
- fake fallback-текст не генерируется как будто это ответ модели.
