import { evaluateScenario, getBaselineScore, getCatalog, InputError } from './features/simulator/service.js';
import { explainScenario } from './features/simulator/analysis.js';

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  OPENAI_API_KEY?: string;
  AI_RATE_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  },
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname.replace(/\/$/, '');
    if (!path.startsWith('/api') && !path.startsWith('/media')) return env.ASSETS.fetch(request);
    if (path !== '/api/simulator') return json({ error: 'Маршрут не найден.' }, 404);
    if (request.method === 'GET') return json({ ...getCatalog(), baselineScore: getBaselineScore() });
    if (request.method !== 'POST') return json({ error: 'Метод не поддерживается.' }, 405);

    /* Bound actual bytes, including requests without Content-Length. */
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'Выберите ровно 5 мероприятий.' }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 100 * 1024) { await reader.cancel(); return json({ error: 'Слишком большой запрос.' }, 413); }
        chunks.push(value);
      }
      const buffer = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }
      let body: unknown;
      try { body = JSON.parse(new TextDecoder().decode(buffer)); }
      catch { return json({ error: 'Некорректный JSON в запросе.' }, 400); }
      const decisions = body && typeof body === 'object' && 'decisions' in body ? body.decisions : undefined;
      const result = evaluateScenario(decisions);
      const { success } = await env.AI_RATE_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') ?? 'unknown' });
      if (!success) return json({ error: 'Слишком много расчётов. Подождите минуту и повторите.' }, 429);
      try {
        const analysis = await explainScenario(result, env.OPENAI_API_KEY ?? '');
        return json({ ...result, analysis, analysisError: null });
      } catch (error) {
        return json({ ...result, analysis: null, analysisError: error instanceof Error ? error.message : 'AI-анализ недоступен.' });
      }
    } catch (error) {
      if (error instanceof InputError) return json({ error: error.message }, 400);
      return json({ error: 'Не удалось рассчитать сценарий.' }, 500);
    }
  },
};
