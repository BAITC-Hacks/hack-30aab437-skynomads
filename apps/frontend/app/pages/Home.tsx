import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Activity, ArrowRight, Check, Compass, ListChecks, Plus, Sparkles, Wallet, X } from 'lucide-react';
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

  const updateChoice = (index: number, choice: Decision) => {
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
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);
    setError('');
    try {
      setResult(await submitScenario(choices));
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
        <div className="command__status"><span className="command__pulse" /> ДЕМО · СИНТЕТИЧЕСКИЕ ДАННЫЕ</div>
      </header>

      <div className="command__layout">
        <nav className="command__nav" aria-label="Разделы сценария">
          <a href="#map" title="Карта районов"><Compass size={22} /><span>Карта</span></a>
          <a href="#plan" title="Выбранные решения"><ListChecks size={22} /><span>Решения</span></a>
          <a href="#results" title="Итоговый результат"><Activity size={22} /><span>Результат</span></a>
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
                          <div className="initiative__icon" aria-hidden="true">{measure.id}</div>
                          <div className="initiative__info">
                            <strong>{measure.name}</strong>
                            <small>{measure.scope === 'Город' ? 'Весь город' : 'Выбор района'} · эффект через {measure.lagQuarters} кв.</small>
                          </div>
                          <div className="initiative__action">
                            <strong>{measure.cost} ед.</strong>
                            <button type="button" disabled={isSelected || selectedCount === 5}
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

              <section className="plan" id="plan" aria-labelledby="plan-heading">
                <div className="plan__intro">
                  <div><span className="command__eyebrow">ВАШ СЦЕНАРИЙ / 05 РЕШЕНИЙ</span><h2 id="plan-heading">План города</h2>
                    <p>Добавьте пять разных мер минимум из трёх направлений. Не больше двух мер одного направления.</p></div>
                  <button type="button" className="plan__example" onClick={() => {
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
                <div className="dashboard__scores">
                  <span className="command__eyebrow">КАЧЕСТВО ЖИЗНИ ПО РАЙОНАМ</span>
                  <div className="dashboard__districts">
                    {catalog.districts.map((district) => {
                      const outcome = result?.districts.find((item) => item.name === district.name);
                      return <div className="dashboard__district" key={district.name}>
                        <span>{district.name}</span>
                        <strong>{(outcome?.score ?? district.baselineDistrictScore).toFixed(2)}</strong>
                        {outcome && <small className={outcome.delta >= 0 ? 'is-positive' : 'is-negative'}>
                          {outcome.delta >= 0 ? '+' : ''}{outcome.delta.toFixed(2)}
                        </small>}
                      </div>;
                    })}
                  </div>
                </div>
                <div className="dashboard__score">
                  <span className="command__eyebrow">ASTANA QUALITY OF LIFE SCORE</span>
                  <strong>{(result?.score ?? catalog.baselineScore).toFixed(2)} <small>/ 100</small></strong>
                  <p>{result ? `Изменение: ${(result.score - result.baselineScore) >= 0 ? '+' : ''}${(result.score - result.baselineScore).toFixed(2)} · остаток ${result.remaining} ед.` : 'Базовый уровень до ваших решений'}</p>
                  <div className="dashboard__meter" aria-hidden="true"><span style={{ width: `${result?.score ?? catalog.baselineScore}%` }} /></div>
                </div>
                <div className="dashboard__analysis">
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
