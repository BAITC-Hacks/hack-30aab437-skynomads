import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CITY_EVENTS, type CityEvent } from './events.js';

interface District {
  name: string;
  populationShare: number;
  indicators: Record<string, number>;
  baselineDistrictScore: number;
}

interface Measure {
  id: string;
  name: string;
  direction: string;
  scope: 'Район' | 'Город';
  cost: number;
  lagQuarters: number;
  fullEffects: Record<string, number>;
}

interface Dataset {
  indicators: { definitions: { code: string; name: string; direction: string }[] };
  districts: District[];
  measures: Measure[];
  simulation: { horizonQuarters: number };
  synergies: { pairs: { measureIds: string[]; bonus: Record<string, number> }[] };
  incompatibilities: { measureIds: string[]; condition: string }[];
  score: {
    indicatorWeights: Record<string, number>;
    cityAverageWeight: number;
    minimumDistrictWeight: number;
    criticalIndicatorThresholdExclusive: number;
    criticalPairPenalty: number;
  };
  rules: { budget: number; decisionCountExact: number; maxMeasuresPerDirection: number };
}

export interface Decision {
  measureId: string;
  district: string | null;
}

export interface DistrictResult {
  name: string;
  score: number;
  delta: number;
  indicators: Record<string, number>;
  changes: Record<string, number>;
}

export interface ScenarioResult {
  budget: number;
  reservedBudget: number;
  event: CityEvent | null;
  cost: number;
  remaining: number;
  score: number;
  baselineScore: number;
  criticalPairs: number;
  districts: DistrictResult[];
  measures: { name: string; district: string | null; effects: Record<string, number> }[];
  synergies: string[];
}

export class InputError extends Error {}

/* Yarn workspaces run backend scripts with apps/backend as the working directory. */
const dataset = JSON.parse(
  readFileSync(resolve(process.cwd(), 'db.json'), 'utf8'),
) as Dataset;

const measuresById = new Map(dataset.measures.map((measure) => [measure.id, measure]));
const districtNames = new Set(dataset.districts.map((district) => district.name));

export const resolveEvent = (input: unknown): CityEvent | null => {
  if (input === undefined || input === null || input === '') return null;
  const event = typeof input === 'string' ? CITY_EVENTS.find((item) => item.id === input) : undefined;
  if (!event) throw new InputError('Неизвестное городское событие. Выберите условия из каталога.');
  return event;
};

const startingDistricts = (event: CityEvent | null): District[] => dataset.districts.map((district) => {
  if (!event) return district;
  const indicators = { ...district.indicators };
  for (const shock of event.shocks) {
    if (shock.district !== null && shock.district !== district.name) continue;
    for (const [code, effect] of Object.entries(shock.effects)) indicators[code] += effect;
  }
  for (const code of Object.keys(indicators)) indicators[code] = Math.max(0, Math.min(100, indicators[code]));
  const baselineDistrictScore = Object.entries(dataset.score.indicatorWeights)
    .reduce((sum, [code, weight]) => sum + weight * indicators[code], 0);
  return { ...district, indicators, baselineDistrictScore };
});

export const getCatalog = (eventId?: unknown) => ({
  budget: dataset.rules.budget - (resolveEvent(eventId)?.reserve ?? 0),
  reservedBudget: resolveEvent(eventId)?.reserve ?? 0,
  event: resolveEvent(eventId),
  districts: startingDistricts(resolveEvent(eventId)),
  indicators: dataset.indicators.definitions,
  measures: dataset.measures,
});

export const validateDecisions = (input: unknown, budget = dataset.rules.budget): Decision[] => {
  if (!Array.isArray(input) || input.length !== dataset.rules.decisionCountExact) {
    throw new InputError(`Выберите ровно ${dataset.rules.decisionCountExact} мероприятий.`);
  }

  const seen = new Set<string>();
  const directions = new Map<string, number>();
  const decisions: Decision[] = [];

  for (const item of input) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      throw new InputError('Каждое решение должно содержать ID мероприятия и район.');
    }

    const { measureId, district } = item as Record<string, unknown>;
    if (typeof measureId !== 'string' || !measuresById.has(measureId)) {
      throw new InputError('Неизвестное мероприятие.');
    }
    if (seen.has(measureId)) {
      throw new InputError(`Мероприятие ${measureId} выбрано повторно.`);
    }

    const measure = measuresById.get(measureId)!;
    if (measure.scope === 'Район' && (typeof district !== 'string' || !districtNames.has(district))) {
      throw new InputError(`Для ${measureId} выберите существующий район.`);
    }
    if (measure.scope === 'Город' && district !== null && district !== undefined) {
      throw new InputError(`Для городской меры ${measureId} район не указывается.`);
    }

    seen.add(measureId);
    directions.set(measure.direction, (directions.get(measure.direction) ?? 0) + 1);
    decisions.push({ measureId, district: measure.scope === 'Город' ? null : district as string });
  }

  if ([...directions.values()].some((count) => count > dataset.rules.maxMeasuresPerDirection)) {
    throw new InputError('Не более двух мероприятий из одного направления.');
  }

  const cost = decisions.reduce((sum, decision) => sum + measuresById.get(decision.measureId)!.cost, 0);
  if (cost > budget) {
    throw new InputError(`Превышен доступный бюджет: ${cost} из ${budget}. Перераспределите средства.`);
  }

  for (const conflict of dataset.incompatibilities) {
    const [first, second] = conflict.measureIds.map((id) => decisions.find((item) => item.measureId === id));
    if (first && second && (conflict.condition === 'В любом районе' || first.district === second.district)) {
      throw new InputError(`Мероприятия ${first.measureId} и ${second.measureId} несовместимы в выбранных районах.`);
    }
  }

  return decisions;
};

const compute = (decisions: Decision[], event: CityEvent | null = null): ScenarioResult => {
  const selected = new Map(decisions.map((decision) => [decision.measureId, decision]));
  const appliedSynergies = dataset.synergies.pairs.filter(({ measureIds }) => measureIds.every((id) => selected.has(id)));
  let criticalPairs = 0;

  const districts = startingDistricts(event).map((district) => {
    const indicators = { ...district.indicators };

    for (const decision of decisions) {
      const measure = measuresById.get(decision.measureId)!;
      if (measure.scope === 'Район' && decision.district !== district.name) continue;
      for (const [code, effect] of Object.entries(measure.fullEffects)) {
        indicators[code] += effect * (dataset.simulation.horizonQuarters - measure.lagQuarters)
          / dataset.simulation.horizonQuarters;
      }
    }

    for (const synergy of appliedSynergies) {
      if (selected.get(synergy.measureIds[0])?.district !== district.name) continue;
      for (const [code, bonus] of Object.entries(synergy.bonus)) indicators[code] += bonus;
    }

    for (const code of Object.keys(indicators)) {
      indicators[code] = Math.max(0, Math.min(100, indicators[code]));
      if (indicators[code] < dataset.score.criticalIndicatorThresholdExclusive) criticalPairs++;
    }

    const score = Object.entries(dataset.score.indicatorWeights)
      .reduce((sum, [code, weight]) => sum + weight * indicators[code], 0);
    const changes = Object.fromEntries(Object.entries(indicators)
      .map(([code, value]) => [code, value - district.indicators[code]]));
    return { name: district.name, score, delta: score - district.baselineDistrictScore, indicators, changes };
  });

  const average = districts.reduce((sum, district, index) =>
    sum + dataset.districts[index].populationShare * district.score, 0);
  const score = dataset.score.cityAverageWeight * average
    + dataset.score.minimumDistrictWeight * Math.min(...districts.map((district) => district.score))
    - dataset.score.criticalPairPenalty * criticalPairs;
  const cost = decisions.reduce((sum, decision) => sum + measuresById.get(decision.measureId)!.cost, 0);

  return {
    budget: dataset.rules.budget - (event?.reserve ?? 0),
    reservedBudget: event?.reserve ?? 0,
    event,
    cost,
    remaining: dataset.rules.budget - (event?.reserve ?? 0) - cost,
    score,
    baselineScore: 0,
    criticalPairs,
    districts,
    measures: decisions.map((decision) => {
      const measure = measuresById.get(decision.measureId)!;
      return {
        name: measure.name,
        district: decision.district,
        effects: Object.fromEntries(Object.entries(measure.fullEffects).map(([code, effect]) =>
          [code, effect * (dataset.simulation.horizonQuarters - measure.lagQuarters)
            / dataset.simulation.horizonQuarters])),
      };
    }),
    synergies: appliedSynergies.map(({ measureIds }) => measureIds.join(' + ')),
  };
};

const baseline = compute([]).score;

export const evaluateScenario = (input: unknown, eventId?: unknown): ScenarioResult => {
  const event = resolveEvent(eventId);
  const decisions = validateDecisions(input, dataset.rules.budget - (event?.reserve ?? 0));
  return { ...compute(decisions, event), baselineScore: event ? compute([], event).score : baseline };
};

export const getBaselineScore = (eventId?: unknown): number => {
  const event = resolveEvent(eventId);
  return event ? compute([], event).score : baseline;
};
