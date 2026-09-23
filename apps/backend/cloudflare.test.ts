import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './cloudflare.js';

const example = [
  { measureId: 'M7', district: 'Нура' }, { measureId: 'M8', district: 'Нура' },
  { measureId: 'M10', district: 'Нура' }, { measureId: 'M12', district: null },
  { measureId: 'M5', district: 'Сарыарка' },
];
const env = {
  ASSETS: { fetch: async () => new Response('SPA asset') },
  AI_RATE_LIMITER: { limit: async () => ({ success: true }) },
};
const request = (body: string) => new Request('https://demo.test/api/simulator', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
});

test('Worker matches local API and preserves score without a secret', async () => {
  const catalog = await worker.fetch(new Request('https://demo.test/api/simulator'), env);
  assert.equal(catalog.status, 200);
  assert.equal((await catalog.json() as { budget: number }).budget, 100);
  const result = await worker.fetch(request(JSON.stringify({ decisions: example })), env);
  const body = await result.json() as { cost: number; score: number; analysis: null; analysisError: string };
  assert.equal(body.cost, 95); assert.equal(Number(body.score.toFixed(2)), 56.54);
  assert.equal(body.analysis, null); assert.match(body.analysisError, /OPENAI_API_KEY/);
  assert.equal(await (await worker.fetch(new Request('https://demo.test/'), env)).text(), 'SPA asset');
});

test('Worker rejects malformed, oversized, invalid and rate-limited requests', async () => {
  assert.equal((await worker.fetch(request('{broken'), env)).status, 400);
  assert.equal((await worker.fetch(request(JSON.stringify({ decisions: [] })), env)).status, 400);
  assert.equal((await worker.fetch(request(' '.repeat(102401)), env)).status, 413);
  const limited = { ...env, AI_RATE_LIMITER: { limit: async () => ({ success: false }) } };
  assert.equal((await worker.fetch(request(JSON.stringify({ decisions: example })), limited)).status, 429);
  assert.equal((await worker.fetch(new Request('https://demo.test/api/auth'), env)).status, 404);
  assert.equal((await worker.fetch(new Request('https://demo.test/api/simulator', { method: 'DELETE' }), env)).status, 405);
});
