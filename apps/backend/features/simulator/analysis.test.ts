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
    assert.equal((JSON.parse(body.input) as { score: number }).score, scenario.score);
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
