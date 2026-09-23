import test from 'node:test';
import assert from 'node:assert/strict';
import { explainScenario } from './analysis.js';
import { evaluateScenario } from './service.js';

const scenario = evaluateScenario([
  { measureId: 'M7', district: 'Нура' },
  { measureId: 'M8', district: 'Нура' },
  { measureId: 'M10', district: 'Нура' },
  { measureId: 'M12', district: null },
  { measureId: 'M5', district: 'Сарыарка' },
]);

test('missing API key fails explicitly without a generated explanation', async () => {
  const previous = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    await assert.rejects(explainScenario(scenario), /OPENAI_API_KEY/);
  } finally {
    if (previous !== undefined) process.env.OPENAI_API_KEY = previous;
  }
});

test('analysis sends computed data through the real Responses HTTP contract', async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = 'test-only-key';
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    const body = JSON.parse(String(options?.body)) as { model: string; input: string; store: boolean };
    assert.equal(body.model, 'gpt-4o-mini');
    assert.equal(body.store, false);
    const facts = JSON.parse(body.input) as {
      score: number;
      budget: number; cost: number; remaining: number;
      strongestImprovement: { district: string };
      weakestDistrict: { district: string };
      districtMeasureCounts: Record<string, number>;
      selectedMeasures: { name: string; cost: number; lagQuarters: number; effects: Record<string, number> }[];
      districtIndicatorChanges: { district: string; changes: Record<string, number> }[];
      citywideMeasures: string[];
    };
    assert.equal(facts.score, 56.54);
    assert.equal(facts.budget, 100);
    assert.equal(facts.cost, 95);
    assert.equal(facts.remaining, 5);
    assert.equal(facts.strongestImprovement.district, 'Нура');
    assert.equal(facts.weakestDistrict.district, 'Нура');
    assert.deepEqual(facts.districtMeasureCounts, { Нура: 3, Сарыарка: 1 });
    assert.equal(facts.selectedMeasures.length, 5);
    assert.equal(facts.selectedMeasures[0].effects.S1, 10);
    assert.equal(facts.selectedMeasures[0].cost, 24);
    assert.equal(facts.selectedMeasures[0].lagQuarters, 3);
    assert.equal(facts.districtIndicatorChanges.find((item) => item.district === 'Нура')?.changes.B1, 12.5);
    assert.equal(facts.citywideMeasures.length, 1);
    assert.equal((options?.headers as Record<string, string>).Authorization, 'Bearer test-only-key');
    return new Response(JSON.stringify({
      status: 'completed',
      output: [{ type: 'message', content: [{ type: 'output_text', text: 'Объяснение' }] }],
    }), { status: 200 });
  };

  try {
    assert.equal(await explainScenario(scenario), 'Объяснение');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test('provider failures are explicit and never leak upstream content', async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = 'test-only-key';
  try {
    for (const status of [401, 429, 500]) {
      globalThis.fetch = async () => new Response('private upstream details', { status });
      await assert.rejects(explainScenario(scenario), (error: Error) =>
        error.message.startsWith('AI-сервис') && !error.message.includes('private'));
    }
    for (const body of ['invalid-json', 'null', '{"status":"completed","output":{}}',
      '{"status":"completed","output":[{"type":"message","content":[{"type":"output_text","text":3}]}]}',
      '{"status":"incomplete","output":[]}']) {
      globalThis.fetch = async () => new Response(body, { status: 200 });
      await assert.rejects(explainScenario(scenario), /AI-сервис/);
    }
    globalThis.fetch = async () => { throw new Error('network internals'); };
    await assert.rejects(explainScenario(scenario), /AI-сервис недоступен/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});
