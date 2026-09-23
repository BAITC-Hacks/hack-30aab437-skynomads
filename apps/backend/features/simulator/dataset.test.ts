import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('runtime db.json contains exactly the application fields from the full dataset', () => {
  const source = JSON.parse(readFileSync(resolve(process.cwd(), '../../docs/data-set.json'), 'utf8'));
  const runtime = JSON.parse(readFileSync(resolve(process.cwd(), 'db.json'), 'utf8'));

  assert.deepEqual(runtime, {
    indicators: {
      definitions: source.indicators.definitions.map(({ code, direction, name }: {
        code: string; direction: string; name: string;
      }) => ({ code, direction, name })),
    },
    districts: source.districts.map(({ name, populationShare, indicators, baselineDistrictScore }: {
      name: string; populationShare: number; indicators: Record<string, number>;
      baselineDistrictScore: number;
    }) => ({ name, populationShare, indicators, baselineDistrictScore })),
    simulation: { horizonQuarters: source.simulation.horizonQuarters },
    measures: source.measures,
    synergies: {
      pairs: source.synergies.pairs.map(({ measureIds, bonus }: {
        measureIds: string[]; bonus: Record<string, number>;
      }) => ({ measureIds, bonus })),
    },
    incompatibilities: source.incompatibilities.map(({ measureIds, condition }: {
      measureIds: string[]; condition: string;
    }) => ({ measureIds, condition })),
    score: {
      indicatorWeights: source.score.indicatorWeights,
      cityAverageWeight: source.score.cityAverageWeight,
      minimumDistrictWeight: source.score.minimumDistrictWeight,
      criticalIndicatorThresholdExclusive: source.score.criticalIndicatorThresholdExclusive,
      criticalPairPenalty: source.score.criticalPairPenalty,
    },
    rules: {
      budget: source.rules.budget,
      decisionCountExact: source.rules.decisionCountExact,
      maxMeasuresPerDirection: source.rules.maxMeasuresPerDirection,
    },
  });
});
