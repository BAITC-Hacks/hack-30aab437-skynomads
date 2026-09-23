# UI Specification — Isometric City

## Visual direction

Цель: не фотореализм и не сложный SimCity.

Стиль:

- pseudo-3D / 2.5D isometric;
- визуально ближе к 2GIS 3D или простой mobile farm game;
- здания — простые бежевые/молочные блоки;
- деревья — low-poly;
- вода — спокойный голубой;
- дороги — серо-бежевые;
- минимум текстур;
- мягкие тени;
- небольшие машины/автобусы/люди как ambient animation.

Главное преимущество — **читабельность**, а не детализация.

## Composition

### 1. Main city — ~70% screen

Центральная изометрическая карта.

На ней:

- 5 условных районов;
- река/мосты как визуальный ориентир;
- дороги;
- жилые блоки;
- социальные здания;
- парки;
- стройки;
- маленький транспорт;
- районные labels.

### 2. Top HUD

```text
Аким на 5 часов

Budget 100
Spent 41
Remaining 59

Decisions 2 / 5

Year 2025
Q1 / 8
[▶] [≫] [Pause]
```

## 3. Initiative drawer

Справа или как overlay.

Tabs:

- Transport
- Ecology
- Social
- Safety
- Services

Карточка:

```text
M7
Школа + детсад

24
Lag: 3Q
Scope: Район

S1 +16

[Выбрать]
```

## 4. District panel

По клику на район:

```text
НУРА
District Score 49.18

Transport      47.5
Ecology        55.0
Social         36.5 ⚠
Safety         52.5
Services       55.0

Critical:
S1 Schools 38
S2 Clinics 35
```

## 5. X-Ray layers

Toolbar:

- CITY
- TRAFFIC
- GREEN
- SOCIAL
- SAFETY
- SERVICES
- QoL

При выборе слоя город перекрашивается по соответствующим KPI.

Например SOCIAL:
- зелёный: высокий score;
- жёлтый: средний;
- красный: критический.

## 6. Build interaction

Flow:

```text
initiative
→ choose district
→ preview effect
→ confirm
→ building site appears
```

Preview:

```text
Build School + Kindergarten
District: Нура

Cost: 24
Budget after: 76
Lag: 3 quarters

Expected model effect:
S1 +10 within current 8Q horizon

[Confirm]
```

Значение preview должно приходить из simulation engine, не рассчитываться вручную в UI.

## 7. Construction states

### Planned
ghost building / outline

### Building
crane + construction box

### Complete
simple beige building + category icon

Не нужны реалистичные модели.

## 8. Timeline simulation

После 5/5 решений:

`▶ SIMULATE 2 YEARS`

Визуальные события:

- quarter counter;
- construction progress;
- появление объектов;
- краткие KPI popups;
- изменение district labels.

## 9. Result HUD

После Q8:

```text
ASTANA QUALITY OF LIFE

52.56 → 56.54
+3.98

Weakest district:
Нура 49.18 → ...

Critical indicators:
2 → 0

Synergy:
M10 + M12
```

## 10. AI panel

Показывать после simulation, не держать постоянно открытым.

Sections:

- Сильные стороны
- Риски
- Компромиссы
- Что попробовать иначе

## 11. Responsive priority

Для demo ориентируемся прежде всего на desktop / laptop.

На узком экране:

- city остаётся главным;
- initiative panel превращается в bottom sheet;
- KPI/AI открываются отдельными панелями.

## 12. What NOT to show

Не показывать вымышленные точные значения, которых нет в модели:

- «7 830 детей получили место»;
- «12 480 жителей сменили транспорт»;
- «пробки уменьшились на 17.3%»,

если отдельная micro-model этого не считает.

Можно показывать только dataset-backed KPI и narrative interpretation.
