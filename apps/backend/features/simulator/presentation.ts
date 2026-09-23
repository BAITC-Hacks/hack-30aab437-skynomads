import pptxgen from 'pptxgenjs';
import { evaluateScenario, getCatalog, type ScenarioResult } from './service.js';
import { validateTeamName } from './teams.js';

export const createPresentation = async (teamName: unknown, decisions: unknown, eventId: unknown, analysis: string | null) => {
  const name = validateTeamName(teamName);
  const result = evaluateScenario(decisions, eventId);
  const catalog = getCatalog(eventId);
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'SKYNOMADS';
  pptx.subject = 'Синтетическая модель HackAlem AI';
  pptx.title = `Решение команды ${name}`;
  pptx.lang = 'ru-RU';
  const ink = 'EDF4FC';
  const muted = 'A7BDD0';
  const accent = '54DBA2';
  const slide = (title: string, index: number) => {
    const s = pptx.addSlide();
    s.background = { color: '122330' };
    s.addText('АКИМ НА 5 ЧАСОВ / HACKALEM AI', { x: .55, y: .3, w: 11, h: .3, color: accent, fontSize: 12, fontFace: 'Arial' });
    s.addText(title, { x: .55, y: .9, w: 12.2, h: .85, color: ink, fontSize: 28, fontFace: 'Arial', bold: true, breakLine: false, fit: 'shrink' });
    s.addText(`Синтетическая модель · ${name} · ${index}/5`, { x: .55, y: 7.05, w: 12, h: .2, color: muted, fontSize: 10, fontFace: 'Arial' });
    return s;
  };
  const text = (s: ReturnType<typeof slide>, value: string, y: number, size = 20) => s.addText(value, { x: .65, y, w: 12, h: .65, color: ink, fontFace: 'Arial', fontSize: size, fit: 'shrink', margin: 0 });

  const first = slide(`Решение команды «${name}»`, 1);
  text(first, result.event?.title ?? 'Базовые условия: пять решений для города', 2.1, 24);
  text(first, `Quality of Life Score: ${result.score.toFixed(2)} (${(result.score - result.baselineScore) >= 0 ? '+' : ''}${(result.score - result.baselineScore).toFixed(2)} к исходному)`, 3.15, 30);
  text(first, `План: ${result.cost} / ${result.budget} ед. · Резерв события: ${result.reservedBudget} · Остаток: ${result.remaining}`, 4.3);
  text(first, 'Горизонт: 8 кварталов. Числа рассчитаны кодом; AI объясняет компромиссы.', 5.4, 17);

  const plan = slide('Пять управленческих решений', 2);
  result.measures.forEach((measure, index) => {
    const original = catalog.measures.find((item) => item.name === measure.name)!;
    text(plan, `${index + 1}. ${measure.name}`, 1.95 + index * .83, 19);
    plan.addText(`${measure.district ?? 'Весь город'} · ${original.cost} ед. · лаг ${original.lagQuarters} кв.`, { x: 1, y: 2.4 + index * .83, w: 11, h: .3, color: muted, fontSize: 12, fontFace: 'Arial' });
  });

  const districts = slide('Качество жизни по районам: до → после', 3);
  result.districts.forEach((district, index) => {
    const before = catalog.districts.find((item) => item.name === district.name)!.baselineDistrictScore;
    const y = 2.05 + index * .83;
    districts.addText(district.name, { x: .65, y, w: 1.9, h: .3, color: ink, fontSize: 15, fontFace: 'Arial' });
    districts.addShape(pptx.ShapeType.rect, { x: 2.7, y, w: before / 100 * 7, h: .18, fill: { color: '667C91' }, line: { transparency: 100 } });
    districts.addShape(pptx.ShapeType.rect, { x: 2.7, y: y + .25, w: district.score / 100 * 7, h: .18, fill: { color: accent }, line: { transparency: 100 } });
    districts.addText(`${before.toFixed(2)} → ${district.score.toFixed(2)} (${district.delta >= 0 ? '+' : ''}${district.delta.toFixed(2)})`, { x: 10, y, w: 2.6, h: .55, color: ink, fontSize: 14, fontFace: 'Arial' });
  });
  text(districts, 'Серый — исходное состояние активных условий. Зелёный — после решений.', 6.4, 13);

  const impact = slide('Влияние, синергии и ограничения', 4);
  text(impact, `Критических показателей ниже 40: ${result.criticalPairs}`, 2.0, 23);
  text(impact, `Синергии: ${result.synergies.join('; ') || 'не активированы'}`, 3.0, 20);
  const lowest = result.districts.reduce((a, b) => a.score < b.score ? a : b);
  text(impact, `Самый слабый район: ${lowest.name} — ${lowest.score.toFixed(2)}`, 4.0, 22);
  text(impact, 'Score = 70% среднего по населению + 30% слабейшего района − критические пары.', 5.05, 17);
  text(impact, result.event ? `Событие: ${result.event.description}` : 'Официальные базовые данные. Остаток бюджета не даёт бонуса.', 6.0, 15);

  const report = slide('Объяснение решения команды', 5);
  const narrative = analysis?.replace(/[#*`]/g, '').trim();
  report.addText(narrative ? narrative.slice(0, 2200) : 'AI-объяснение недоступно. Числовые результаты и план сформированы расчётным движком. Проверьте конфигурацию OpenAI на сервере.', { x: .65, y: 1.95, w: 12, h: 4.6, color: ink, fontSize: 18, fontFace: 'Arial', fit: 'shrink', valign: 'top', breakLine: false });
  const data = await pptx.write({ outputType: 'nodebuffer' });
  return Buffer.from(data as Buffer);
};
