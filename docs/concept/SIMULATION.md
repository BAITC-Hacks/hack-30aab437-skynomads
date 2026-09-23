# Simulation Model

## Source of truth

Канонический источник:

`docs/data-set.json`

UI и AI обязаны считать этот файл источником истины.

## Dimensions

10 показателей по шкале 0–100:

### Transport
- T1 — Разгрузка дорог
- T2 — Доступность общественного транспорта

### Ecology
- E1 — Озеленение
- E2 — Качество воздуха

### Social
- S1 — Школы и детсады
- S2 — Поликлиники и первичная медпомощь

### Safety
- B1 — Безопасность улиц
- B2 — Безопасность дорожного движения

### Services
- C1 — Надёжность ЖКХ
- C2 — Скорость решения обращений

Во всех показателях больше = лучше.

## Districts

5 условных районов:

- Есиль
- Алматы
- Сарыарка
- Байконур
- Нура

## Measures

Dataset содержит 14 инициатив `M1..M14`.

Каждая содержит:

```json
{
  "id": "M7",
  "direction": "Соцсфера",
  "scope": "Район",
  "cost": 24,
  "lagQuarters": 3,
  "fullEffects": {
    "S1": 16
  }
}
```

## Simulation horizon

`8 quarters = 2 условных года`

Доля эффекта:

```text
effectFraction = (8 - lagQuarters) / 8
```

Обновление показателя:

```text
I' =
clip(
  I
  + Σ(fullEffect × effectFraction)
  + synergies,
  0,
  100
)
```

## District score

```text
D_d = Σ(weight_k × I'_dk)
```

Indicator weights:

| Indicator | Weight |
|---|---:|
| T1 | 0.10 |
| T2 | 0.10 |
| E1 | 0.09 |
| E2 | 0.11 |
| S1 | 0.11 |
| S2 | 0.11 |
| B1 | 0.09 |
| B2 | 0.09 |
| C1 | 0.10 |
| C2 | 0.10 |

## City score

```text
D_avg = Σ(populationShare_d × D_d)
```

Final:

```text
Score =
0.7 × D_avg
+ 0.3 × min(D_d)
- 1.0 × N_crit
```

Где `N_crit` — число пар «район × показатель» строго ниже 40.

## Baseline

Dataset baseline:

- City average ≈ 56.86
- Weakest district: Нура ≈ 49.18
- Critical pairs: 2
- Final Score: **52.56**

Critical baseline values:
- Нура S1 = 38
- Нура S2 = 35

## Reference scenario

Проверочный набор:

1. M7 → Нура
2. M8 → Нура
3. M10 → Нура
4. M12 → City
5. M5 → Сарыарка

Properties:

- cost = 95;
- remaining = 5;
- synergy = M10 + M12;
- current implementation in `main` calculates Score ≈ **56.5431** before display rounding;
- UI may display **56.54**.

## UI mapping

### District cards
`DistrictResult.score`

### Color of district
By selected X-Ray metric or district score.

### Top budget
`cost / remaining`

### Timeline
`lagQuarters`

### Initiative cards
`measures[]`

### Result delta
`newScore - baselineScore`

### Critical warnings
all indicators `< 40`

### Synergy animation
only from dataset synergy rules.

## Important rule

**AI never calculates these values.**

Simulation engine returns deterministic JSON.

AI receives the result and explains it.
