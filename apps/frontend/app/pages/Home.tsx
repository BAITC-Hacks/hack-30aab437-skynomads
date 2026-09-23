import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Activity, ArrowRight, Check, Compass, ListChecks, Plus, Sparkles, Wallet, X, Bus, Trees, School, ShieldCheck, Settings, Sun, Building2, Users, FileText } from 'lucide-react';
import { CityMap } from '@/features/simulator/CityMap';
import { loadCatalog, submitScenario } from '@/features/simulator/api';
import type { Catalog, Decision, Scenario } from '@/features/simulator/api';
import './Home.scss';

const EMPTY_CHOICES: Decision[] = Array.from({ length: 5 }, () => ({ measureId: '', district: null }));
const EXAMPLE: Decision[] = [
  { measureId: 'M7', district: 'Нура' },
  { measureId: 'M8', district: 'Нура' },
  { measureId: 'M10', district: 'Нура' },
  { measureId: 'M12', district: null },
  { measureId: 'M5', district: 'Сарыарка' },
];

const Home = () => {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [choices, setChoices] = useState<Decision[]>(EMPTY_CHOICES);
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Транспорт');
  const [result, setResult] = useState<Scenario | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [panel, setPanel] = useState<'map' | 'plan' | 'analysis'>('map');

  const refreshCatalog = async () => {
    setLoading(true);
    setError('');
    try {
      setCatalog(await loadCatalog());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось загрузить каталог.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refreshCatalog(); }, []);
  useEffect(() => {
    if (panel === 'map') return;
    const previous = document.activeElement as HTMLElement | null;
    const container = document.getElementById(panel === 'plan' ? 'plan' : 'ai-report');
    container?.querySelector<HTMLButtonElement>('.panel-close')?.focus();
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setPanel('map'); };
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('keydown', close); previous?.focus(); };
  }, [panel]);

  const updateChoice = (index: number, choice: Decision) => {
    if (submitting) return;
    setChoices((current) => current.map((item, position) => position === index ? choice : item));
    setResult(null);
    setError('');
  };

  const addMeasure = (measureId: string) => {
    if (!catalog || choices.some((choice) => choice.measureId === measureId)) return;
    const slot = choices.findIndex((choice) => !choice.measureId);
    if (slot === -1) return;
    const measure = catalog.measures.find((item) => item.id === measureId);
    if (!measure) return;
    updateChoice(slot, {
      measureId,
      district: measure.scope === 'Город' ? null : activeDistrict ?? '',
    });
    if (measure.scope === 'Район' && !activeDistrict) setPanel('plan');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);
    setError('');
    try {
      setResult(await submitScenario(choices));
      setPanel('analysis');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось рассчитать сценарий.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCount = choices.filter((choice) => choice.measureId).length;
  const spent = choices.reduce((sum, choice) =>
    sum + (catalog?.measures.find((measure) => measure.id === choice.measureId)?.cost ?? 0), 0);
  const budget = catalog?.budget ?? 100;
  const categories = [...new Set(catalog?.measures.map((measure) => measure.direction) ?? [])];
  const categoryIcons = [Bus, Trees, School, ShieldCheck, Settings];
  const categoryScores = categories.map((name) => {
    const codes = catalog!.indicators.filter((indicator) => indicator.direction === name).map((indicator) => indicator.code);
    const before = catalog!.districts.reduce((sum, district) => sum + codes.reduce((n, code) => n + district.indicators[code], 0), 0) / (catalog!.districts.length * codes.length);
    const delta = result ? result.districts.reduce((sum, district) => sum + codes.reduce((n, code) => n + district.changes[code], 0), 0) / (result.districts.length * codes.length) : 0;
    return { name, before, delta, value: before + delta };
  });

  return (
    <main className="command">
      <header className="command__header">
        <div className="command__identity">
          <div className="command__mark" aria-hidden="true"><span /><span /><span /></div>
          <div><strong>Аким на 5 часов</strong><small>AI-симулятор управления городом</small></div>
          <p>Ваши решения. Проверяемый эффект.<br />Лучшее будущее города начинается здесь.</p>
        </div>
        <div className="command__budget-top" aria-label={`Бюджет: ${budget}, потрачено ${spent}, остаток ${Math.max(0, budget - spent)}`}>
          <Wallet size={21} strokeWidth={1.8} aria-hidden="true" />
          <div className="command__budget-copy"><small>Бюджет города · условные единицы</small><strong>{budget}</strong></div>
          <div className="command__budget-stat"><small>Потрачено</small><strong>{spent}</strong></div>
          <div className="command__budget-stat"><small>Осталось</small><strong className={spent > budget ? 'is-negative' : ''}>{budget - spent}</strong></div>
          <div className="command__budget-track" aria-hidden="true"><span style={{ width: `${Math.min(100, spent / budget * 100)}%` }} /></div>
        </div>
        <div className="command__status"><Sun size={28} color="#ffd144" /><div><strong>Горизонт: 2 года</strong><small>8 кварталов · {selectedCount} из 5 решений</small></div><button type="button" onClick={() => setPanel('plan')} aria-label="Открыть план решений"><ListChecks size={23} /></button></div>
      </header>

      <div className="command__layout">
        <nav className="command__nav" aria-label="Разделы сценария">
          <button type="button" className={panel === 'map' ? 'is-active' : ''} onClick={() => setPanel('map')}><Compass size={22} /><span>Карта</span></button>
          <a href="#results" title="Показатели города"><Activity size={22} /><span>Показатели</span></a>
          <button type="button" className={panel === 'plan' ? 'is-active' : ''} onClick={() => setPanel('plan')}><ListChecks size={22} /><span>Решения</span></button>
          <button type="button" className={panel === 'analysis' ? 'is-active' : ''} onClick={() => setPanel('analysis')}><FileText size={22} /><span>AI-отчёт</span></button>
        </nav>

        <div className="command__body">
          {loading && <p className="command__message" role="status">Загружаем районы и мероприятия…</p>}
          {error && <p className="command__error" role="alert">{error}</p>}
          {!catalog && !loading && (
            <button type="button" className="command__retry" onClick={() => void refreshCatalog()}>
              Повторить загрузку
            </button>
          )}

          {catalog && (
            <>
              <div className="command__stage">
                <CityMap districts={catalog.districts} results={result?.districts}
                  activeDistrict={activeDistrict} onSelect={setActiveDistrict} />

                <div className="mayor-card"><div className="mayor-card__portrait"><Building2 size={48} strokeWidth={1.2} /><small>АКИМ</small></div><p><strong>Вы — аким Астаны.</strong>У вас 5 ключевых решений и ограниченный бюджет. Развивайте город, учитывайте потребности жителей и создавайте лучшее будущее!</p></div>
                <div className="city-advisor"><Users size={30} /><div><small>Ваш план развития</small><strong>{selectedCount} из 5 инициатив выбрано</strong><p>{activeDistrict ? `Район в фокусе: ${activeDistrict}.` : 'Выберите район на карте, затем добавьте инициативу.'}</p><button type="button" onClick={() => setPanel('plan')}>Посмотреть решения <ArrowRight size={15} /></button></div></div>

                <aside className="initiative" aria-labelledby="initiative-heading">
                  <div className="initiative__head">
                    <span className="command__eyebrow">КАТАЛОГ ГОРОДСКИХ МЕР</span>
                    <h2 id="initiative-heading">Выберите инициативы</h2>
                    <p>Районные меры добавляются для выбранного на карте района. Назначение можно изменить в плане.</p>
                  </div>
                  <div className="initiative__tabs" aria-label="Направление мероприятий">
                    {categories.map((direction) => (
                      <button type="button" key={direction}
                        className={direction === activeCategory ? 'is-active' : ''}
                        aria-pressed={direction === activeCategory}
                        onClick={() => setActiveCategory(direction)}>{direction}</button>
                    ))}
                  </div>
                  <div className="initiative__list">
                    {catalog.measures.filter((measure) => measure.direction === activeCategory).map((measure) => {
                      const isSelected = choices.some((choice) => choice.measureId === measure.id);
                      return (
                        <article className="initiative__card" key={measure.id}>
                          <div className={`initiative__icon initiative__icon--${categories.indexOf(measure.direction)}`} aria-hidden="true">{React.createElement(categoryIcons[categories.indexOf(measure.direction)] ?? Building2, { size: 36, strokeWidth: 1.3 })}<small>{measure.id}</small></div>
                          <div className="initiative__info">
                            <strong>{measure.name}</strong>
                            <small>{measure.scope === 'Город' ? 'Весь город' : 'Выбор района'} · эффект через {measure.lagQuarters} кв.</small>
                          </div>
                          <div className="initiative__action">
                            <strong>{measure.cost} ед.</strong>
                          <button type="button" disabled={submitting || isSelected || selectedCount === 5}
                              onClick={() => addMeasure(measure.id)}>
                              {isSelected ? <><Check size={14} /> В плане</> : <><Plus size={14} /> Выбрать</>}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </aside>
              </div>

              {panel === 'plan' && <div className="command__veil" onClick={() => setPanel('map')} />}
              <section className="plan" id="plan" role="dialog" aria-label="План города" aria-labelledby="plan-heading" hidden={panel !== 'plan'}>
                <button type="button" className="panel-close" onClick={() => setPanel('map')} aria-label="Закрыть план"><X size={22} /></button>
                <div className="plan__intro">
                  <div><span className="command__eyebrow">ВАШ СЦЕНАРИЙ / 05 РЕШЕНИЙ</span><h2 id="plan-heading">План города</h2>
                    <p>Добавьте пять разных мер минимум из трёх направлений. Не больше двух мер одного направления.</p></div>
                  <button type="button" className="plan__example" disabled={submitting} onClick={() => {
                    setChoices(EXAMPLE.map((item) => ({ ...item })));
                    setActiveDistrict('Нура');
                    setResult(null);
                    setError('');
                  }}>Загрузить демо-набор <ArrowRight size={17} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="plan__slots">
                    {choices.map((choice, index) => {
                      const measure = catalog.measures.find((item) => item.id === choice.measureId);
                      return (
                        <div className={`plan__slot${measure ? ' plan__slot--filled' : ''}`} key={index}>
                          <span className="plan__index">0{index + 1}</span>
                          <div className="plan__measure">
                            <strong>{measure?.name ?? 'Добавьте меру из каталога'}</strong>
                            <small>{measure ? `${measure.direction} · ${measure.cost} ед.` : 'Свободный слот'}</small>
                          </div>
                          {measure?.scope === 'Район' && (
                            <label className="plan__district"><span>Район</span>
                              <select value={choice.district ?? ''} onChange={(event) =>
                                updateChoice(index, { ...choice, district: event.target.value })}>
                                <option value="">Выберите район</option>
                                {catalog.districts.map((district) => (
                                  <option key={district.name} value={district.name}>{district.name}</option>
                                ))}
                              </select>
                            </label>
                          )}
                          {measure?.scope === 'Город' && <span className="plan__city">Весь город</span>}
                          {measure && <button type="button" className="plan__remove" aria-label={`Убрать ${measure.name}`}
                            onClick={() => updateChoice(index, { measureId: '', district: null })}><X size={17} /></button>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="plan__footer">
                    <div className="plan__totals">
                      <span>Выбрано <strong>{selectedCount} / 5</strong></span>
                      <span>Расход <strong className={spent > budget ? 'is-negative' : ''}>{spent} / {budget}</strong></span>
                      {spent > budget && <small role="alert">Бюджет превышен на {spent - budget} ед.</small>}
                    </div>
                    <button type="submit" className="command__primary" disabled={submitting || spent > budget}>
                      {submitting ? 'Рассчитываем и анализируем…' : <>Рассчитать результат <ArrowRight size={18} /></>}
                    </button>
                  </div>
                </form>
              </section>

              <section className="dashboard" id="results" aria-label="Показатели и результат">
                <div className="dashboard__scores" title="Среднее арифметическое показателей направления по пяти районам; не итоговая взвешенная оценка Score">
                  <span className="command__eyebrow">Ключевые показатели города</span>
                  <div className="dashboard__districts">
                    {categoryScores.map((item, index) => {
                      return <div className={`dashboard__district dashboard__district--${index}`} key={item.name}>
                        <span>{React.createElement(categoryIcons[index], { size: 23 })}{item.name}</span>
                        <strong>{item.value.toFixed(1)}</strong>
                        {result && <small className={item.delta >= 0 ? 'is-positive' : 'is-negative'}>
                          {item.delta >= 0 ? '↑ +' : '↓ '}{item.delta.toFixed(1)}
                        </small>}
                      </div>;
                    })}
                  </div>
                </div>
                <div className="dashboard__score">
                  <span className="command__eyebrow">ASTANA QUALITY OF LIFE SCORE</span>
                  <div className="score-ring" style={{ background: `conic-gradient(#36ddbd ${(result?.score ?? catalog.baselineScore) * 3.6}deg, #62778e 0deg)` }}><div><strong>{(result?.score ?? catalog.baselineScore).toFixed(2)}</strong><small>/100</small></div></div>
                  <p>{result ? `Изменение: ${(result.score - result.baselineScore) >= 0 ? '+' : ''}${(result.score - result.baselineScore).toFixed(2)} · остаток ${result.remaining} ед.` : 'Базовый уровень до ваших решений'}</p>
                  <div className="dashboard__meter" aria-hidden="true"><span style={{ width: `${result?.score ?? catalog.baselineScore}%` }} /></div>
                </div>
                <div className="dashboard__chart"><span className="command__eyebrow">Районы · до / после</span><div className="district-chart">{catalog.districts.map((district) => {
                  const outcome = result?.districts.find((item) => item.name === district.name);
                  return <div key={district.name}><span>{district.name}</span><div><i style={{ width: `${district.baselineDistrictScore}%` }} /><b style={{ width: `${outcome?.score ?? district.baselineDistrictScore}%` }} /></div><small>{(outcome?.score ?? district.baselineDistrictScore).toFixed(1)}</small></div>;
                })}</div><small className="chart-legend">Серый — исходный · Бирюзовый — текущий</small></div>
                <div className="dashboard__analysis" id="ai-report" role="dialog" aria-label="AI-отчёт" hidden={panel !== 'analysis'}>
                  <button type="button" className="panel-close" onClick={() => setPanel('map')} aria-label="Закрыть отчёт"><X size={22} /></button>
                  <span className="command__eyebrow"><Sparkles size={16} /> AI-АНАЛИЗ</span>
                  {result?.analysis ? <div className="dashboard__ai-text"><ReactMarkdown>{result.analysis}</ReactMarkdown></div> : result?.analysisError
                    ? <p role="alert" className="dashboard__ai-error">{result.analysisError}</p>
                    : <p>После расчёта здесь появится объяснение сильных сторон, рисков и компромиссов выбранного сценария.</p>}
                  {result && <small>Критических показателей: {result.criticalPairs} · Синергии: {result.synergies.length ? result.synergies.join(', ') : 'нет'}</small>}
                </div>
              </section>

              <footer className="command__footer"><span>ASTANA CITY LAB</span><p>Условная модель городских решений, не прогноз для реальной Астаны.</p>
                <a href="#map">Наверх <ArrowRight size={14} /></a></footer>
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default Home;
