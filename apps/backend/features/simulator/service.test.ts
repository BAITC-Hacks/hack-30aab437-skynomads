import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateScenario, getBaselineScore, InputError } from './service.js';

const example = [
  { measureId: 'M7', district: 'Нура' },
  { measureId: 'M8', district: 'Нура' },
  { measureId: 'M10', district: 'Нура' },
  { measureId: 'M12', district: null },
  { measureId: 'M5', district: 'Сарыарка' },
];

test('base and example follow the documented formula', () => {
  assert.equal(Number(getBaselineScore().toFixed(2)), 52.56);
  const result = evaluateScenario(example);
  assert.equal(result.cost, 95);
  assert.equal(result.remaining, 5);
  assert.equal(Number(result.score.toFixed(4)), 56.5431);
  assert.equal(result.criticalPairs, 0);
  assert.deepEqual(result.synergies, ['M10 + M12']);
  assert.equal(result.districts.find((district) => district.name === 'Нура')?.changes.B1, 12.5);
  assert.equal(result.districts.find((district) => district.name === 'Алматы')?.changes.C2, 4.375);
  assert.equal(evaluateScenario([...example].reverse()).score, result.score);
});

test('invalid scenarios do not produce a score', () => {
  const invalid = [
    [],
    [...example.slice(0, 4), example[0]],
    [...example.slice(0, 4), { measureId: 'M99', district: 'Нура' }],
    [...example.slice(0, 4), { measureId: 'M5', district: 'несуществующий' }],
    [...example.slice(0, 3), { measureId: 'M12', district: 'Нура' }, example[4]],
    [example[0], example[1], { measureId: 'M9', district: 'Нура' }, example[3], example[4]],
    [example[0], example[1], { measureId: 'M3', district: 'Нура' },
      { measureId: 'M13', district: 'Алматы' }, { measureId: 'M14', district: null }],
    [{ measureId: 'M1', district: 'Нура' }, { measureId: 'M3', district: 'Алматы' },
      { measureId: 'M9', district: 'Нура' }, { measureId: 'M10', district: 'Нура' },
      { measureId: 'M12', district: null }],
    [{ measureId: 'M4', district: 'Нура' }, example[0], example[2], example[3], example[1]],
  ];
  for (const decisions of invalid) {
    assert.throws(() => evaluateScenario(decisions), InputError);
  }
});

test('district-only conflicts depend on the assigned district', () => {
  const compatible = [
    { measureId: 'M4', district: 'Есиль' },
    { measureId: 'M7', district: 'Нура' },
    { measureId: 'M10', district: 'Нура' },
    { measureId: 'M12', district: null },
    { measureId: 'M9', district: 'Есиль' },
  ];
  assert.ok(evaluateScenario(compatible).score > getBaselineScore());
});

test('a value of 40 is safe but a negative side effect can create a new critical pair', () => {
  const result = evaluateScenario([
    { measureId: 'M11', district: 'Алматы' },
    { measureId: 'M10', district: 'Нура' },
    { measureId: 'M9', district: 'Нура' },
    { measureId: 'M12', district: null },
    { measureId: 'M4', district: 'Есиль' },
  ]);
  assert.equal(result.districts.find((district) => district.name === 'Алматы')?.indicators.T1, 38.25);
  assert.equal(result.districts.find((district) => district.name === 'Нура')?.indicators.S1, 40.625);
  assert.equal(result.criticalPairs, 2);
});
