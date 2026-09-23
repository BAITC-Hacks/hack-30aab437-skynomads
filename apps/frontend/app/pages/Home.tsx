import React, { useEffect, useState } from 'react';
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
  const [result, setResult] = useState<Scenario | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    loadCatalog().then((data) => { if (active) setCatalog(data); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Ошибка загрузки.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const updateChoice = (index: number, choice: Decision) => {
    setChoices((current) => current.map((item, position) => position === index ? choice : item));
    setResult(null);
    setError('');
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

  const spent = choices.reduce((sum, choice) =>
    sum + (catalog?.measures.find((measure) => measure.id === choice.measureId)?.cost ?? 0), 0);
  const budget = catalog?.budget ?? 100;
  const directions = [...new Set(catalog?.measures.map((measure) => measure.direction) ?? [])];

  return (
    <main className="simulator">
      <header className="simulator__header">
        <span className="simulator__brand">SKYNOMADS <span> / CITY LAB</span></span>
        <span className="simulator__tag">Синтетическая модель · 8 кварталов</span>
      </header>

      <div className="simulator__content">
        <div className="simulator__intro">
          <div>
            <p className="simulator__eyebrow">Городская лаборатория / Астана</p>
            <h1>Аким на 5 часов<span>.</span></h1>
            <p className="simulator__lead">Пять решений. Один бюджет. Посмотрите, как выбор команды меняет качество жизни в каждом районе.</p>
          </div>
          <div className="simulator__baseline">
            <span>Исходный индекс</span>
            <strong>{catalog ? catalog.baselineScore.toFixed(2) : '—'}</strong>
            <small>Astana Quality of Life Score</small>
          </div>
        </div>

        {loading && <p role="status" className="simulator__notice">Загружаем каталог мероприятий…</p>}
        {error && <p role="alert" className="simulator__error">{error}</p>}

        {catalog && (
          <div className="simulator__grid">
            <section className="simulator__panel" aria-labelledby="plan-heading">
              <div className="simulator__section-head">
                <div>
                  <p className="simulator__eyebrow">01 / План действий</p>
                  <h2 id="plan-heading">Распределите бюджет</h2>
                </div>
                <button type="button" className="simulator__example" onClick={() => {
                  setChoices(EXAMPLE.map((choice) => ({ ...choice })));
                  setResult(null);
                  setError('');
                }}>Вставить пример</button>
              </div>
              <p className="simulator__help">Ровно 5 разных мер · не более 2 в одном направлении · несовместимые меры запрещены.</p>

              <form onSubmit={handleSubmit}>
                <div className="simulator__choices">
                  {choices.map((choice, index) => {
                    const measure = catalog.measures.find((item) => item.id === choice.measureId);
                    return (
                      <div className="simulator__choice" key={index}>
                        <span className="simulator__number">0{index + 1}</span>
                        <label>
                          <span>Мероприятие</span>
                          <select value={choice.measureId} onChange={(event) => {
                            const next = catalog.measures.find((item) => item.id === event.target.value);
                            updateChoice(index, { measureId: event.target.value, district: next?.scope === 'Город' ? null : '' });
                          }}>
                            <option value="">Выберите меру</option>
                            {directions.map((direction) => (
                              <optgroup label={direction} key={direction}>
                                {catalog.measures.filter((item) => item.direction === direction).map((item) => (
                                  <option value={item.id} key={item.id}>{item.id} · {item.name} — {item.cost}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>Район</span>
                          <select value={choice.district ?? ''} disabled={!measure || measure.scope === 'Город'}
                            onChange={(event) => updateChoice(index, { ...choice, district: event.target.value })}>
                            <option value="">{measure?.scope === 'Город' ? 'Весь город' : 'Выберите район'}</option>
                            {catalog.districts.map((district) => <option key={district.name} value={district.name}>{district.name}</option>)}
                          </select>
                        </label>
                      </div>
                    );
                  })}
                </div>
                <div className="simulator__footer">
                  <div className="simulator__budget">
                    <span>Затраты <strong className={spent > budget ? 'simulator__over' : ''}>{spent} / {budget}</strong></span>
                    <div className="simulator__progress" aria-hidden="true"><span style={{ width: `${Math.min(spent, budget)}%` }} /></div>
                    <small>{spent > budget ? `Превышение на ${spent - budget}` : `Остаток: ${budget - spent}`}</small>
                  </div>
                  <button className="simulator__submit" type="submit" disabled={submitting || spent > budget}>
                    {submitting ? 'Рассчитываем и анализируем…' : 'Рассчитать сценарий →'}
                  </button>
                </div>
              </form>
            </section>

            <aside className="simulator__side" aria-label="Исходные показатели">
              <div className="simulator__section-head">
                <div><p className="simulator__eyebrow">02 / Исходные данные</p><h2>Пять районов</h2></div>
              </div>
              <p className="simulator__help">Все показатели по шкале 0–100: выше — лучше. Данные условные.</p>
              <div className="simulator__district-list">
                {catalog.districts.map((district) => (
                  <details key={district.name} className="simulator__district-details">
                    <summary className="simulator__district">
                      <strong>{district.name}</strong>
                      <span>{district.baselineDistrictScore.toFixed(2)} <small>балл района</small></span>
                    </summary>
                    <dl className="simulator__indicators">
                      {catalog.indicators.map((indicator) => (
                        <div key={indicator.code}><dt>{indicator.name}</dt><dd>{district.indicators[indicator.code]}</dd></div>
                      ))}
                    </dl>
                  </details>
                ))}
              </div>
              <p className="simulator__fineprint">Нажмите на район, чтобы увидеть исходные показатели. Оценка использует веса из датасета.</p>
            </aside>
          </div>
        )}

        {result && (
          <section className="simulator__results" aria-live="polite" aria-labelledby="result-heading">
            <div className="simulator__result-top">
              <div><p className="simulator__eyebrow">03 / Результат сценария</p><h2 id="result-heading">Эффект ваших решений</h2></div>
              <div className="simulator__score"><span>Quality of Life Score</span><strong>{result.score.toFixed(2)}</strong><small>было {result.baselineScore.toFixed(2)} · изменение {(result.score - result.baselineScore) >= 0 ? '+' : ''}{(result.score - result.baselineScore).toFixed(2)}</small></div>
            </div>
            <div className="simulator__result-grid">
              <div>
                <h3>Районы после решений</h3>
                <div className="simulator__district-list">
                  {result.districts.map((district) => (
                    <div className="simulator__district" key={district.name}><strong>{district.name}</strong><span>{district.score.toFixed(2)} <small>{district.delta >= 0 ? '+' : ''}{district.delta.toFixed(2)}</small></span></div>
                  ))}
                </div>
                <p className="simulator__fineprint">Стоимость: {result.cost} · Остаток: {result.remaining} · Критических показателей: {result.criticalPairs}{result.synergies.length > 0 ? ` · Синергия: ${result.synergies.join(', ')}` : ''}</p>
              </div>
              <div className="simulator__analysis">
                <h3>AI-анализ</h3>
                {result.analysis ? <p>{result.analysis}</p> : <p role="alert">{result.analysisError}</p>}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default Home;
