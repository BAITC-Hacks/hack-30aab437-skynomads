# MVP Plan — 3 developers

## Goal

Сделать один убедительный end-to-end demo:

```text
Explore city
→ choose 5 decisions
→ see them appear on map
→ simulate Q1..Q8
→ get deterministic QoL Score
→ receive AI explanation
```

## P0 — must have

### DEV 1 — Isometric / Game UI

Owner:
- центральная псевдо-3D карта;
- 5 визуальных районов;
- camera/pan/zoom;
- базовые building/road/tree assets;
- стройка / finished object states;
- simple vehicles/citizens ambient animation.

Definition of done:
- карта выглядит как простой 2GIS/farm-city;
- можно подсветить район;
- можно визуально разместить выбранную инициативу.

### DEV 2 — Simulation integration

Owner:
- переиспользовать existing backend scoring;
- API result → UI state;
- district scores;
- KPI deltas;
- Q1–Q8 timeline mapping;
- validation errors;
- synergies/conflicts.

Definition of done:
- reference scenario даёт тот же Score, что current backend;
- UI не содержит hardcoded simulation numbers.

### DEV 3 — Product / AI / HUD

Owner:
- budget / decisions HUD;
- initiative drawer;
- result panel;
- AI explanation;
- polished demo flow;
- empty/error/loading states.

Definition of done:
- пользователь проходит сценарий без devtools;
- AI объясняет calculated result;
- при отсутствии AI ключа Score всё равно работает.

## P1 — strong demo upgrades

1. X-Ray layers:
   - Transport
   - Ecology
   - Social
   - Safety
   - Services

2. Animated Q1–Q8 timeline.

3. Synergy animation.

4. Conflict modal.

5. Weakest district / critical indicator callouts.

## P2 — only if P0/P1 stable

- synthetic citizen cards;
- representative-agent animation;
- scenario A/B comparison;
- unexpected city event;
- AI City Council presentation;
- auto-generated summary slide.

## Demo script

### 00:00
Открываем город.

```text
Budget 100
Decisions 0/5
QoL 52.56
```

### 00:20
Переключаем Social X-Ray.

Показываем:
- Нура S1=38;
- Нура S2=35.

### 00:40
Выбираем M7 School + Kindergarten → Нура.

На карте появляется стройка.

### 01:10
Добавляем ещё 4 решения, включая M10 + M12.

UI показывает synergy.

### 01:40
Нажимаем:

`▶ SIMULATE 2 YEARS`

### 02:00
Q1 → Q8.

Стройки завершаются, районы меняют показатели.

### 02:30
Показываем:

```text
52.56 → 56.54
```

и изменения районов.

### 03:00
AI объясняет:
- сильные стороны;
- риски;
- компромиссы.

### 03:30
Меняем одно решение и показываем, что Score меняется.

Это напрямую закрывает критерий:
> изменение набора решений приводит к изменению Astana Quality of Life Score.

## Scope discipline

Если времени мало, режем в таком порядке:

1. micro-agents;
2. multiplayer;
3. citizen cards;
4. scenario compare;
5. сложные анимации.

Нельзя резать:

- working 5-decision flow;
- budget validation;
- deterministic Score;
- visible map reaction;
- AI explanation;
- reproducible demo.

## One-line handoff for Codex

> Build the isometric layer as a visual client for the existing deterministic simulator; do not rewrite scoring, do not invent city metrics, and keep the main demo loop 5 decisions → Q1..Q8 → Score → AI explanation.
