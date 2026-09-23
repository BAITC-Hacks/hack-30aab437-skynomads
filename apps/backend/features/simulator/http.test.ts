import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { ScenarioResult } from './service.js';

const errorBody = async (response: Response): Promise<{ error: string }> => {
  const value = await response.json();
  assert.ok(value && typeof value === 'object' && 'error' in value && typeof value.error === 'string');
  return value as { error: string };
};

test('HTTP contract: catalog, validation, safe errors and disabled boilerplate routes', async () => {
  /* Isolated test process: do not bind the demo port or spend real OpenAI credits. */
  process.env.VERCEL = '1';
  process.env.OPENAI_API_KEY = '';
  process.env.NODE_ENV = 'test';
  const { default: app } = await import('../../server.js');
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}`;
  const post = (body: unknown) => fetch(`${url}/api/simulator`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  try {
    const catalog = await (await fetch(`${url}/api/simulator`)).json() as {
      budget: number; districts: unknown[]; measures: unknown[];
    };
    assert.equal(catalog.budget, 100);
    assert.equal(catalog.districts.length, 5);
    assert.equal(catalog.measures.length, 14);
    for (const body of [{}, null, { decisions: [] }, { decisions: 'invalid' }]) {
      const response = await post(body);
      assert.equal(response.status, 400);
      assert.equal(typeof (await errorBody(response)).error, 'string');
    }
    const malformed = await fetch(`${url}/api/simulator`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{secret:wrong',
    });
    assert.equal(malformed.status, 400);
    assert.equal((await errorBody(malformed)).error, 'Некорректный JSON в запросе.');
    const oversized = await post({ decisions: [], padding: 'x'.repeat(110000) });
    assert.equal(oversized.status, 413);
    assert.equal((await errorBody(oversized)).error, 'Слишком большой запрос.');
    const response = await post({ decisions: [
      { measureId: 'M7', district: 'Нура' }, { measureId: 'M8', district: 'Нура' },
      { measureId: 'M10', district: 'Нура' }, { measureId: 'M12', district: null },
      { measureId: 'M5', district: 'Сарыарка' },
    ] });
    assert.equal(response.status, 200);
    const result = await response.json() as ScenarioResult & { analysis: null; analysisError: string };
    assert.equal(result.cost, 95);
    assert.equal(Number(result.score.toFixed(2)), 56.54);
    assert.equal(result.analysis, null);
    assert.match(result.analysisError, /OPENAI_API_KEY/);
    for (const route of ['/api/auth/register', '/api/blog/sendmail', '/media']) {
      const absent = await fetch(`${url}${route}`, { method: 'POST' });
      assert.equal(absent.status, 404);
      assert.equal((await errorBody(absent)).error, 'Маршрут не найден.');
    }
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
