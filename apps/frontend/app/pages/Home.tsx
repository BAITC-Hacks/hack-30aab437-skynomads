import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { CityMap } from '@/features/simulator/CityMap';
import { loadCatalog, submitScenario } from '@/features/simulator/api';
import type { Catalog, Decision, Scenario } from '@/features/simulator/api';
import './Home.scss';

const EXAMPLE: Decision[] = [
  { measureId: 'M7', district: 'Нура' }, { measureId: 'M8', district: 'Нура' },
  { measureId: 'M10', district: 'Нура' }, { measureId: 'M12', district: null },
  { measureId: 'M5', district: 'Сарыарка' },
];
const layers = ['CITY', 'QoL', 'Транспорт', 'Экология', 'Соцсфера', 'Безопасность', 'Сервисы'];
const layerNames: Record<string, string> = { CITY: 'ГОРОД', QoL: 'QoL', Транспорт: 'ТРАНСПОРТ', Экология: 'ЭКОЛОГИЯ', Соцсфера: 'СОЦСФЕРА', Безопасность: 'БЕЗОПАСНОСТЬ', Сервисы: 'СЕРВИСЫ' };
const directionIcons: Record<string, string> = { Транспорт: '↗', Экология: '♣', Соцсфера: '✚', Безопасность: '◆', Сервисы: '▦' };

const Home = () => {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [choices, setChoices] = useState<Decision[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const districtStrip = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState('Все');
  const [layer, setLayer] = useState('CITY');
  const [result, setResult] = useState<Scenario | null>(null);
  const [quarter, setQuarter] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [resultOpen, setResultOpen] = useState(true);

  useEffect(() => {
    let active = true;
    loadCatalog().then((data) => { if (active) setCatalog(data); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Ошибка загрузки каталога.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!running || quarter >= 8) return;
    const timer = window.setTimeout(() => setQuarter((value) => value + 1), 850);
    return () => window.clearTimeout(timer);
  }, [running, quarter]);

  useEffect(() => { if (running && result && quarter === 8) setRunning(false); }, [running, result, quarter]);
  useEffect(() => { districtStrip.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }, [selected]);

  const resetResult = () => { setResult(null); setQuarter(0); setError(''); };
  const spent = choices.reduce((sum, choice) => sum + (catalog?.measures.find((item) => item.id === choice.measureId)?.cost ?? 0), 0);
  const budget = catalog?.budget ?? 100;
  const directions = [...new Set(catalog?.measures.map((item) => item.direction) ?? [])];
  const visibleMeasures = catalog?.measures.filter((item) => !running && choices.length < 5 && !choices.some((choice) => choice.measureId === item.id) && item.cost <= budget - spent && (direction === 'Все' || item.direction === direction)) ?? [];
  const district = catalog?.districts.find((item) => item.name === selected);
  const finished = !!result && quarter === 8;
  const completedThisQuarter = catalog?.measures.filter((item) => choices.some((choice) => choice.measureId === item.id) && item.lagQuarters + 1 === quarter) ?? [];
  const districtResult = finished ? result.districts.find((item) => item.name === selected) : null;
  const indicators = districtResult?.indicators ?? district?.indicators;
  const score = districtResult?.score ?? district?.baselineDistrictScore;

  const addMeasure = (item: Catalog['measures'][number], districtName: string | null) => {
    if (running || choices.length === 5 || choices.some((choice) => choice.measureId === item.id) || spent + item.cost > budget || (item.scope === 'Район' && !districtName)) return;
    setChoices((current) => current.some((choice) => choice.measureId === item.id) ? current : [...current, { measureId: item.id, district: item.scope === 'Город' ? null : districtName }]);
    resetResult();
  };
  const simulate = async () => {
    if (running || submitting || choices.length !== 5) return;
    resetResult(); setQuarter(1); setRunning(true); setResultOpen(true); setSubmitting(true);
    try { setResult(await submitScenario(choices)); setResultOpen(true); }
    catch (cause) { setRunning(false); setQuarter(0); setError(cause instanceof Error ? cause.message : 'Не удалось рассчитать сценарий.'); }
    finally { setSubmitting(false); }
  };

  return <main className={`city-sim${drawerOpen ? '' : ' city-sim--closed'}`}>
    <section className="city-sim__map" aria-label="Карта города">
      {catalog ? <CityMap catalog={catalog} choices={choices} selected={selected} onSelect={setSelected} layer={layer} result={result} finished={finished} quarter={quarter} running={running} /> : <div className="city-sim__map-loading">{loading ? 'Загружаем карту…' : 'Карта недоступна'}</div>}
    </section>

    <div className="city-sim__top-right"><button type="button" className="city-sim__brand" aria-expanded={drawerOpen} aria-controls="city-drawer" onClick={() => setDrawerOpen((value) => !value)}><span className="city-sim__brand-mark">✳</span><strong>ASTANA <span>AKIM5</span></strong><span className="city-sim__brand-toggle">{drawerOpen ? '‹' : '☰'}</span></button>
      <div className="city-sim__score"><span>QoL</span><strong>{finished ? result.score.toFixed(2) : catalog?.baselineScore.toFixed(2) ?? '—'}</strong>{finished && <small>{(result.score - result.baselineScore) >= 0 ? '+' : ''}{(result.score - result.baselineScore).toFixed(2)}</small>}</div></div>

    {drawerOpen && <aside id="city-drawer" className="city-sim__sidebar" aria-label="План решений">
      <div className="city-sim__focus"><small>ОБЗОР / РАЙОН ДЛЯ МЕР</small><div className="city-sim__district-picks" ref={districtStrip} role="group" aria-label="Обзор города и выбор района"><button type="button" className={!selected ? 'active' : ''} aria-pressed={!selected} onClick={() => setSelected(null)}>Обзор</button>{catalog?.districts.map((item) => <button type="button" key={item.name} className={selected === item.name ? 'active' : ''} aria-pressed={selected === item.name} onClick={() => setSelected(item.name)}>{item.name}</button>)}</div>
      </div>
      <div className="city-sim__sidebar-scroll">
        <div className="city-sim__mission"><div><small>ВАША МИССИЯ</small><strong>{choices.length} <span>/ 5 решений</span></strong></div><div className="city-sim__steps" aria-label={`Выбрано ${choices.length} из 5 мер`}>{Array.from({ length: 5 }, (_, index) => <span key={index} className={index < choices.length ? 'filled' : ''} />)}</div></div>
        <div className="city-sim__section-title city-sim__catalog-title"><strong>Инициативы</strong><span>ВЫБЕРИТЕ МЕРУ</span></div>
        <div className="city-sim__categories" aria-label="Направления">{['Все', ...directions].map((item) => <button key={item} type="button" className={direction === item ? 'active' : ''} onClick={() => setDirection(item)}>{item}</button>)}</div>
        <div className="city-sim__inventory">{visibleMeasures.length ? visibleMeasures.map((item) => { const needsDistrict = item.scope === 'Район' && !selected; return <button type="button" key={item.id} className={`city-sim__inventory-card${needsDistrict ? ' needs-district' : ''}`} disabled={needsDistrict} onClick={() => addMeasure(item, selected)}><span className="city-sim__inventory-icon">{directionIcons[item.direction] ?? '◈'}</span><span className="city-sim__inventory-copy"><small>{item.id} · {item.direction}</small><strong>{item.name}</strong><em>{needsDistrict ? 'Выберите район выше' : item.scope === 'Город' ? 'На весь город' : `Район: ${selected}`} · {item.lagQuarters} кв.</em></span><span className="city-sim__inventory-cost">{item.cost}</span></button>; }) : catalog && <p className="city-sim__inventory-empty">{running ? 'Идёт симуляция…' : choices.length === 5 ? 'План заполнен — запускайте сценарий.' : `На остаток ${budget - spent} ед. ${direction === 'Все' ? 'нет доступных мер.' : `нет мер в направлении «${direction}».`}`}</p>}</div>
        <div className="city-sim__plan"><div className="city-sim__section-title"><strong>План</strong><button type="button" disabled={!catalog || running} onClick={() => { setChoices(EXAMPLE.map((item) => ({ ...item }))); resetResult(); }}>Пример ↗</button></div>{Array.from({ length: 5 }, (_, index) => { const choice = choices[index], item = catalog?.measures.find((entry) => entry.id === choice?.measureId); return <div key={index} className={`city-sim__slot ${item ? 'filled' : ''}`}><span className="city-sim__slot-number">0{index + 1}</span>{item ? <><div><strong>{item.name}</strong><small>{choice.district ?? 'Весь город'} · {item.cost} ед.</small></div><button type="button" disabled={running} aria-label={`Убрать ${item.name}`} onClick={() => { setChoices((current) => current.filter((_, position) => position !== index)); resetResult(); }}>×</button></> : <span>Пустой слот</span>}</div>; })}</div>
        {catalog && district && <details className="city-sim__district" key={district.name}><summary><span>{district.name}</span><strong>{score?.toFixed(2)}</strong></summary><div className="city-sim__metrics">{catalog.indicators.map((indicator) => <div key={indicator.code} className={(indicators?.[indicator.code] ?? 100) < 40 ? 'critical' : ''}><span title={indicator.name}>{indicator.name}</span><strong>{indicators?.[indicator.code]?.toFixed(1).replace(/\.0$/, '')}</strong></div>)}</div></details>}
      </div>
      <div className="city-sim__checkout"><button type="button" className="city-sim__checkout-action" disabled={choices.length !== 5 || running || submitting} onClick={simulate}><span><small>ПОТРАЧЕНО</small><strong key={spent} className="city-sim__amount">{spent}<em> / {budget}</em></strong></span><span><small>ОСТАТОК</small><strong key={budget - spent} className="city-sim__amount">{budget - spent}</strong></span><span className="city-sim__checkout-go">{running ? `Q${quarter} / 8` : choices.length === 5 ? '▶ СТАРТ' : `+${5 - choices.length} МЕР`}</span></button><div className="city-sim__budget-track"><span style={{ width: `${Math.min(100, spent / budget * 100)}%` }} /></div>
        {error && <p className="city-sim__error" role="alert">{error}</p>}
      </div>
    </aside>}

    <nav className="city-sim__layers" aria-label="Слои карты">{layers.map((item) => <button type="button" key={item} className={layer === item ? 'active' : ''} onClick={() => setLayer(item)}>{layerNames[item]}</button>)}</nav>

    {(running || result) && (resultOpen ? <section className="city-sim__outcome" aria-live="polite"><div className="city-sim__section-title"><strong>{finished ? 'Результат' : `Q${quarter} / 8`}</strong><button type="button" aria-label="Скрыть результат" onClick={() => setResultOpen(false)}>×</button></div>{finished && result ? <><div className="city-sim__outcome-score">{result.baselineScore.toFixed(2)} <span>→</span> {result.score.toFixed(2)}</div><p>Бюджет {result.cost}/{budget} · Критические {result.criticalPairs}{result.synergies.length ? ` · ${result.synergies.join(', ')}` : ''}</p><div className="city-sim__district-results">{result.districts.map((item) => <div key={item.name}><span>{item.name}</span><strong>{item.score.toFixed(2)}</strong><small>{item.delta >= 0 ? '+' : ''}{item.delta.toFixed(2)}</small></div>)}</div><div className="city-sim__ai"><strong>Как улучшить сценарий</strong>{result.analysis ? <div className="city-sim__recommendations"><ReactMarkdown>{result.analysis}</ReactMarkdown></div> : <p role="alert">{result.analysisError ?? 'Рекомендации недоступны.'}</p>}</div></> : <><p className="city-sim__playback-event">{quarter === 8 ? 'Ожидаем расчёт и AI…' : completedThisQuarter.length ? `Готово: ${completedThisQuarter.map((item) => item.id).join(', ')}` : 'Город меняется…'}</p><div className="city-sim__timeline">{Array.from({ length: 8 }, (_, index) => <span key={index} className={index < quarter ? 'active' : ''}>Q{index + 1}</span>)}</div></>}</section> : <button type="button" className="city-sim__result-tab" onClick={() => setResultOpen(true)}>{finished && result ? `Результат ${result.score.toFixed(2)}` : `Q${quarter}/8`}</button>)}
  </main>;
};

export default Home;
