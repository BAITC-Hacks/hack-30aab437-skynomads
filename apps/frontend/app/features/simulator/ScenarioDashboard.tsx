import React from 'react';
import { Bus, Trees, School, ShieldCheck, Settings, ArrowUp, ArrowDown } from 'lucide-react';
import type { Catalog, Scenario } from './api';

export const directionLabels: Record<string, string> = {
  Транспорт: 'Транспорт', Экология: 'Озеленение', Соцсфера: 'Соц. инфра',
  Безопасность: 'Безопасность', Сервисы: 'Сервисы',
};
const icons = [Bus, Trees, School, ShieldCheck, Settings];
const colors = ['#4589ff', '#54c878', '#ffb33f', '#ff626d', '#a77aeb'];

export const ScenarioDashboard = ({ catalog, result }: { catalog: Catalog; result: Scenario | null }) => {
  const directions = [...new Set(catalog.indicators.map((indicator) => indicator.direction))];
  const scores = directions.map((name) => {
    const codes = catalog.indicators.filter((indicator) => indicator.direction === name).map(({ code }) => code);
    const count = catalog.districts.length * codes.length;
    const before = catalog.districts.reduce((sum, district) =>
      sum + codes.reduce((subtotal, code) => subtotal + district.indicators[code], 0), 0) / count;
    const delta = result ? result.districts.reduce((sum, district) =>
      sum + codes.reduce((subtotal, code) => subtotal + district.changes[code], 0), 0) / count : 0;
    return { name, before, delta, after: before + delta };
  });
  const score = result?.score ?? catalog.baselineScore;
  const delta = score - catalog.baselineScore;

  return (
    <section className="dashboard" id="results" aria-label="Показатели и результат" tabIndex={-1}>
      <div className="dashboard__scores">
        <h2 title="Среднее арифметическое показателей каждого направления по пяти районам">Ключевые показатели города</h2>
        <div className="dashboard__metrics">
          {scores.map((item, index) => {
            const Icon = icons[index];
            return <div className="metric" key={item.name} style={{ '--metric-color': colors[index] } as React.CSSProperties}>
              <div className="metric__label"><Icon size={23} aria-hidden="true" /><span>{directionLabels[item.name]}</span></div>
              <div className="metric__value"><strong>{item.after.toFixed(1)}</strong>
                <span className={item.delta < 0 ? 'is-negative' : 'is-positive'}>
                  {item.delta < 0 ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                  {item.delta >= 0 ? '+' : ''}{item.delta.toFixed(1)}
                </span>
              </div>
            </div>;
          })}
        </div>
      </div>
      <div className="dashboard__score">
        <h2>Astana Quality of Life Score</h2>
        <div className="score-summary">
          <div className="score-ring" style={{ '--score-angle': `${Math.max(0, Math.min(100, score)) * 3.6}deg` } as React.CSSProperties}>
            <div><strong>{score.toFixed(2)}</strong><small>/100</small></div>
          </div>
          <div className="score-summary__change">
            <strong className={delta < 0 ? 'is-negative' : 'is-positive'}>
              {delta < 0 ? <ArrowDown size={19} /> : <ArrowUp size={19} />}{delta >= 0 ? '+' : ''}{delta.toFixed(2)}
            </strong>
            <span>{result ? 'после ваших решений' : 'до ваших решений'}</span>
          </div>
          <div className="score-legend" aria-label="Шкала качества жизни">
            <span><i style={{ background: '#35dac0' }} />Отлично <b>80–100</b></span>
            <span><i style={{ background: '#48b9dc' }} />Хорошо <b>60–79</b></span>
            <span><i style={{ background: '#ffb447' }} />Удовлетворительно <b>40–59</b></span>
            <span><i style={{ background: '#ff6a6d' }} />Требует внимания <b>&lt; 40</b></span>
          </div>
        </div>
      </div>
      <div className="dashboard__chart">
        <h2>Изменение показателей</h2>
        <div className="comparison-chart">
          <svg viewBox="0 0 240 100" role="img" aria-label="Средние показатели направлений до и после решений">
            {[0, 20, 40, 60, 80, 100].map((tick) => <g key={tick}>
              <text x="20" y={84 - tick * .68} textAnchor="end">{tick}</text>
              <path d={`M26 ${81 - tick * .68}H224`} className="comparison-chart__grid" />
            </g>)}
            {scores.map((item, index) => <g key={item.name} stroke={colors[index]}>
              <path d={`M36 ${81 - item.before * .68}L214 ${81 - item.after * .68}`} fill="none" strokeWidth="1.8" />
              <circle cx="36" cy={81 - item.before * .68} r="2.4" fill={colors[index]} />
              <circle cx="214" cy={81 - item.after * .68} r="2.4" fill={colors[index]} />
            </g>)}
            <text x="36" y="97" textAnchor="middle">До</text><text x="214" y="97" textAnchor="middle">После</text>
          </svg>
          <div className="comparison-chart__legend">
            {scores.map((item, index) => <span key={item.name}><i style={{ background: colors[index] }} />{directionLabels[item.name]}</span>)}
            {!result && <small>Ожидает расчёта</small>}
          </div>
        </div>
      </div>
    </section>
  );
};
