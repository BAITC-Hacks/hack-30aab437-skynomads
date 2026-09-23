import { spawn } from 'node:child_process';
import { setTimeout as pause } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

/* Local built-app check; --live explicitly permits one real OpenAI request. */
const live = process.argv.includes('--live');
const backend = fileURLToPath(new URL('../apps/backend/', import.meta.url));
const child = spawn(process.execPath, ['dist/server.js'], {
  cwd: backend,
  env: { ...process.env, PORT: '0', VERCEL: '', NODE_ENV: 'test', ...(live ? {} : { OPENAI_API_KEY: '' }) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let port;
child.stdout.on('data', (chunk) => {
  const match = chunk.toString().match(/Server running on port (\d+)/);
  if (match) port = Number(match[1]);
});
child.stderr.on('data', () => {});
const example = [
  { measureId: 'M7', district: 'Нура' }, { measureId: 'M8', district: 'Нура' },
  { measureId: 'M10', district: 'Нура' }, { measureId: 'M12', district: null },
  { measureId: 'M5', district: 'Сарыарка' },
];
try {
  for (let attempt = 0; attempt < 100 && !port && child.exitCode === null; attempt++) await pause(100);
  assert.ok(port, 'Backend did not start; run yarn build first.');
  const base = `http://127.0.0.1:${port}`;
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /<div id="root"><\/div>/);
  for (const asset of ['/initiatives/optimized/m1-bus-lane.webp', '/initiatives/optimized/akim.webp', '/static/media/Outfit-Latin.woff2']) {
    const response = await fetch(base + asset);
    assert.equal(response.status, 200);
    assert.ok(!response.headers.get('content-type')?.includes('text/html'), `Missing asset: ${asset}`);
  }
  const catalog = await (await fetch(`${base}/api/simulator`)).json();
  assert.equal(catalog.budget, 100); assert.equal(catalog.measures.length, 14);
  const post = (decisions) => fetch(`${base}/api/simulator`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decisions }),
  });
  const invalid = await post([]);
  assert.equal(invalid.status, 400); assert.equal(typeof (await invalid.json()).error, 'string');
  const response = await post(example);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.cost, 95); assert.equal(result.remaining, 5);
  assert.equal(Number(result.score.toFixed(2)), 56.54);
  if (live) {
    assert.ok(typeof result.analysis === 'string' && result.analysis.length > 0, 'No live analysis; check API configuration/quota.');
    assert.equal(result.analysisError, null);
  } else {
    assert.equal(result.analysis, null); assert.match(result.analysisError, /OPENAI_API_KEY/);
  }
  console.log(`PASS: built UI/assets/API; invalid input 400; example 95/5/56.54; AI=${live ? 'live response received' : 'missing-key path verified (no network charge)'}.`);
} finally {
  child.kill();
}
