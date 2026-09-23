import type { ScenarioResult } from './service.js';

interface OpenAIResponse {
  status?: string;
  output?: { type?: string; content?: { type?: string; text?: string }[] }[];
}

export const explainScenario = async (result: ScenarioResult): Promise<string> => {
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
        max_output_tokens: 300,
        instructions: 'Ты формулируешь краткое объяснение готовых фактов синтетической городской модели по-русски. Ответь ровно тремя разделами: «Сильные стороны» — strongestImprovement и подтверждённая синергия, если есть; «Риски» — weakestDistrict и факт наличия/отсутствия критических показателей; «Компромиссы» — распределение районных мер districtMeasureCounts и действие citywideMeasures на все районы. Если называешь эффект конкретной меры, сверяй его код только с selectedMeasures[].effects и районом меры; districtIndicatorChanges показывают итоговые изменения. Значения и названия уже рассчитаны backend: ничего не сортируй, не вычисляй, не подменяй слабейший район и не придумывай дополнительных мер. Не приводи чисел в тексте: они показаны пользователю отдельно. Не делай предположений о здоровье, населении, стоимости, сроках или реализации вне данных. Это не прогноз для реальной Астаны.',
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
