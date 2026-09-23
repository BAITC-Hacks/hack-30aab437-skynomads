import { getCatalog, type ScenarioResult } from './service.js';

interface OpenAIResponse {
  status?: string;
  output?: { type?: string; content?: { type?: string; text?: string }[] }[];
}

export const explainScenario = async (result: ScenarioResult, improvementFrom?: ScenarioResult): Promise<string> => {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error('AI-анализ недоступен: задайте OPENAI_API_KEY на сервере.');

  const strongest = result.districts.reduce((best, district) =>
    district.delta > best.delta ? district : best);
  const weakest = result.districts.reduce((lowest, district) =>
    district.score < lowest.score ? district : lowest);
  const districtMeasures = result.measures.filter((measure) => measure.district !== null);
  const allocation = Object.fromEntries(
    [...new Set(districtMeasures.map((measure) => measure.district))].map((district) =>
      [district, districtMeasures.filter((measure) => measure.district === district).length]),
  );
  const facts = {
    condition: result.event?.title ?? 'Базовый сценарий',
    budget: { available: result.budget, cost: result.cost, remaining: result.remaining, reserved: result.reservedBudget },
    indicatorNames: getCatalog().indicators,
    criticalIndicators: result.districts.flatMap((district) => Object.entries(district.indicators)
      .filter(([, value]) => value < 40).map(([code, value]) => ({ district: district.name, code, value }))),
    originalScenario: improvementFrom ? { score: improvementFrom.score, cost: improvementFrom.cost, criticalPairs: improvementFrom.criticalPairs, measures: improvementFrom.measures } : undefined,
    verifiedScoreImprovement: improvementFrom ? result.score - improvementFrom.score : undefined,
    score: Number(result.score.toFixed(2)),
    baselineScore: Number(result.baselineScore.toFixed(2)),
    strongestImprovement: { district: strongest.name, delta: Number(strongest.delta.toFixed(2)) },
    weakestDistrict: { district: weakest.name, score: Number(weakest.score.toFixed(2)) },
    criticalPairs: result.criticalPairs,
    districtMeasureCounts: allocation,
    selectedMeasures: result.measures,
    districtIndicatorChanges: result.districts.map((district) => ({
      district: district.name,
      changes: district.changes,
    })),
    citywideMeasures: result.measures.filter((measure) => measure.district === null)
      .map((measure) => measure.name),
    confirmedSynergies: result.synergies,
  };

  let response: Response;
  try {
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        store: false,
        max_output_tokens: 650,
        temperature: 0,
        instructions: (improvementFrom
          ? 'Объясни по-русски улучшение плана относительно originalScenario. Дай три коротких раздела: «Что изменить» (конкретная замена меры/района), «Почему лучше» (только предоставленные вычисленные эффекты), «Компромисс» (что теряется при замене). Кандидат уже проверен кодом, ничего не рассчитывай и не предлагай дополнительных замен. Это лучший вариант одной замены, не глобальный оптимум. '
          : 'Объясни по-русски готовые результаты синтетической модели тремя короткими разделами: «Сильные стороны», «Риски», «Компромиссы». Используй strongestImprovement, weakestDistrict и criticalIndicators. ')
          + 'Названия показателей даны в indicatorNames. Критическими называй только пары из criticalIndicators; если список пуст, критических показателей нет. Бюджета хватает на выбранный допустимый план. Эффект конкретной меры связывай только с её selectedMeasures.effects и районом. Не связывай изменения разных показателей причинно. Не придумывай доверие, миграцию, поведение жителей или эффект вне вычисленных данных. Не приводи цифры: они показаны отдельно. Не добавляй числовых обещаний. Это учебная модель, не реальный городской прогноз. Общий ответ — до 150 слов.',
        input: JSON.stringify(facts),
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
