import type { ScenarioResult } from './service.js';

interface OpenAIResponse {
  status?: string;
  output?: { type?: string; content?: { type?: string; text?: string }[] }[];
}

export const explainScenario = async (result: ScenarioResult): Promise<string> => {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error('AI-анализ недоступен: задайте OPENAI_API_KEY на сервере.');

  let response: Response;
  try {
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        store: false,
        max_output_tokens: 450,
        instructions: 'Ты советник синтетического городского симулятора. Дай по-русски 3 короткие практические рекомендации, как улучшить следующий вариант сценария: укажи слабый район или показатель, объясни риск или компромисс и предложи, что пересмотреть в выборе или размещении переданных мер. Опирайся только на переданные рассчитанные значения и доступный остаток бюджета. Не рассчитывай новый Score, не обещай эффект альтернатив, не придумывай меры, цены и цифры. Если вариант не рассчитан, говори «стоит проверить». Не выдавай синтетическую модель за реальный прогноз для Астаны.',
        input: JSON.stringify(result),
      }),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new Error('AI-сервис недоступен или превысил время ожидания. Попробуйте позже.');
  }

  if (!response.ok) {
    throw new Error(response.status === 401
      ? 'AI-сервис отклонил ключ: проверьте OPENAI_API_KEY.'
      : 'AI-сервис вернул ошибку. Попробуйте позже.');
  }

  const data = await response.json() as OpenAIResponse;
  const text = data.output?.filter((item) => item.type === 'message')
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === 'output_text')
    .map((part) => part.text ?? '').join('\n').trim();
  if (data.status !== 'completed' || !text) {
    throw new Error('AI-сервис не вернул готовое объяснение. Попробуйте позже.');
  }
  return text;
};
