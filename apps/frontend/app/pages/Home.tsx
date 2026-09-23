import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  ArrowRight, ArrowUpRight, Check, ChartNoAxesColumnIncreasing, FileText,
  ListChecks, Map, Play, RotateCcw, Settings, Sparkles, Sun, Wallet, X,
  Building2, Info, ChevronLeft, ChevronRight, CircleHelp, MapPin,
  Trophy, Zap, Presentation,
} from 'lucide-react';
import { CityMap } from '@/features/simulator/CityMap';
import { InitiativeThumbnail } from '@/features/simulator/InitiativeThumbnail';
import { CharacterPortrait } from '@/features/simulator/CharacterPortrait';
import { ScenarioDashboard, directionLabels } from '@/features/simulator/ScenarioDashboard';
import { getMapInitiatives } from '@/features/simulator/mapInitiatives';
import { DistrictChanges, EventPanel, PresentationPanel, Recommendations, TeamComparison } from '@/features/simulator/Extensions';
import { loadCatalog, submitScenario } from '@/features/simulator/api';
import type { Catalog, Decision, Scenario } from '@/features/simulator/api';
import './Home.scss';

const emptyChoices = (): Decision[] => Array.from({ length: 5 }, () => ({ measureId: '', district: null }));
const EXAMPLE: Decision[] = [
  { measureId: 'M7', district: 'Нура' }, { measureId: 'M8', district: 'Нура' },
  { measureId: 'M10', district: 'Нура' }, { measureId: 'M12', district: null },
  { measureId: 'M5', district: 'Сарыарка' },
];
const EVENT_EXAMPLE: Decision[] = [
  { measureId: 'M9', district: 'Нура' }, { measureId: 'M10', district: 'Нура' },
  { measureId: 'M11', district: 'Нура' }, { measureId: 'M12', district: null },
  { measureId: 'M4', district: 'Сарыарка' },
];
type Panel = 'map' | 'plan' | 'analysis' | 'indicators' | 'help' | 'teams' | 'events' | 'presentation';
const tips = [
  'Выберите район на карте, затем добавьте инициативу. Для городских мер назначение района не требуется.',
  'Не больше двух мер одного направления. Некоторые инициативы несовместимы — сервер проверит ваш план.',
  'Индекс учитывает и весь город, и самый слабый район. Показатели ниже 40 уменьшают итоговый балл.',
];
const advisors = [
  { character: 'advisor-social', label: 'Советник по социальной инфраструктуре' },
  { character: 'advisor-transport', label: 'Советник по транспорту' },
  { character: 'advisor-environment', label: 'Советник по экологии' },
] as const;

const Home = () => {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [choices, setChoices] = useState<Decision[]>(emptyChoices);
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Транспорт');
  const [result, setResult] = useState<Scenario | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [panel, setPanel] = useState<Panel>('map');
  const [tipIndex, setTipIndex] = useState(0);
  const [teamName, setTeamName] = useState('');
  const advisor = advisors[tipIndex];
  const [focusedInitiative, setFocusedInitiative] = useState<string | null>(null);
  const mapInitiatives = useMemo(() => catalog
    ? getMapInitiatives(choices, catalog.measures, catalog.districts) : [], [choices, catalog]);
  const inspected = mapInitiatives.find((initiative) => initiative.key === focusedInitiative);

  const refreshCatalog = async () => {
    setLoading(true); setError('');
    try { setCatalog(await loadCatalog(catalog?.event?.id)); }
    catch { setError('Не удалось загрузить каталог. Проверьте подключение к серверу.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refreshCatalog(); }, []);
  useEffect(() => {
    if (panel === 'map' || !catalog) return;
    const dialog = document.getElementById(`panel-${panel}`) as HTMLDialogElement | null;
    dialog?.showModal();
    return () => { dialog?.close(); };
  }, [panel, catalog]);

  const updateChoice = (index: number, choice: Decision) => {
    if (submitting) return;
    setChoices((current) => current.map((item, position) => position === index ? choice : item));
    const measure = catalog?.measures.find((item) => item.id === choice.measureId);
    const district = measure?.scope === 'Город' ? activeDistrict ?? catalog?.districts[0].name : choice.district;
    setFocusedInitiative(measure && district ? `${measure.id}:${district}` : null);
    setResult(null); setError('');
  };
  const selectedCount = choices.filter((choice) => choice.measureId).length;
  const spent = choices.reduce((sum, choice) =>
    sum + (catalog?.measures.find((measure) => measure.id === choice.measureId)?.cost ?? 0), 0);
  const budget = catalog?.budget ?? 100;
  const categories = [...new Set(catalog?.measures.map((measure) => measure.direction) ?? [])];
  const addMeasure = (measureId: string) => {
    if (!catalog || submitting || choices.some((choice) => choice.measureId === measureId)) return;
    const slot = choices.findIndex((choice) => !choice.measureId);
    const measure = catalog.measures.find((item) => item.id === measureId);
    if (slot === -1 || !measure) return;
    if (spent + measure.cost > budget) { setError('На эту меру не хватает доступного бюджета. Перераспределите план.'); setPanel('plan'); return; }
    updateChoice(slot, { measureId, district: measure.scope === 'Город' ? null : activeDistrict ?? '' });
    if (measure.scope === 'Район' && !activeDistrict) setPanel('plan');
  };
  const calculate = async () => {
    if (submitting) return;
    if (selectedCount !== 5) {
      setError('Выберите ровно 5 мероприятий. Добавьте недостающие инициативы из каталога.');
      setPanel('plan');
      return;
    }
    setSubmitting(true); setResult(null); setError('');
    try { setResult(await submitScenario(choices, catalog?.event?.id)); setPanel('analysis'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось рассчитать сценарий.'); setPanel('plan'); }
    finally { setSubmitting(false); }
  };
  const reset = () => {
    if (submitting) return;
    setChoices(emptyChoices()); setResult(null); setError('');
    setFocusedInitiative(null);
  };
  const changeEvent = async (id: string | null) => {
    if (submitting) return;
    setSubmitting(true); setError('');
    try {
      const next = await loadCatalog(id);
      setCatalog(next); setResult(null); setPanel('plan');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось изменить условия.'); }
    finally { setSubmitting(false); }
  };
  const applyRecommendation = (decisions: Decision[]) => {
    if (submitting) return;
    setChoices(decisions.map((item) => ({ ...item }))); setResult(null); setError(''); setPanel('plan');
    setFocusedInitiative(null);
  };
  const closePanel = () => setPanel('map');
  const dialogProps = {
    onCancel: (event: React.SyntheticEvent<HTMLDialogElement>) => { event.preventDefault(); closePanel(); },
  };
  const closeButton = <button type="button" className="panel-close" onClick={closePanel} aria-label="Закрыть панель"><X size={20} /></button>;

  return (
    <main className="command">
      <header className="command__header">
        <div className="command__identity">
          <div className="command__mark" aria-hidden="true"><Building2 size={45} strokeWidth={1.1} /><i /></div>
          <div><h1>Аким на 5 часов</h1><small>AI-симулятор управления городом</small></div>
          <p>Ваши решения. Реальный эффект.<br />Лучшее будущее Астаны.</p>
        </div>
        <div className="command__budget-top" aria-label={`Бюджет: ${budget}, потрачено ${spent}, осталось ${budget - spent}`}>
          <Wallet className="command__wallet" size={27} strokeWidth={1.5} />
          <div className="command__budget-copy"><small>Бюджет города</small><strong>{budget.toLocaleString('ru-RU')} <em>усл. ед.</em></strong></div>
          <div className="command__budget-stat"><small>Потрачено</small><strong>{spent} <em>ед.</em></strong></div>
          <div className="command__budget-stat"><small>Осталось</small><strong className={spent > budget ? 'is-negative' : ''}>{budget - spent} <em>ед.</em></strong></div>
          <div className="command__budget-track" aria-hidden="true"><span style={{ width: `${Math.min(100, spent / budget * 100)}%` }} /></div>
        </div>
        <div className="command__controls">
          <Sun size={29} className="command__sun" aria-hidden="true" />
          <div className="command__horizon"><strong>Горизонт 2 года</strong><small>8 кварталов · {selectedCount} из 5 решений</small></div>
          <button type="button" onClick={() => setPanel('plan')} aria-label="Открыть план решений" title="План решений"><ListChecks size={21} /></button>
          <button type="button" className="command__run" disabled={!catalog || submitting || selectedCount !== 5 || spent > budget}
            onClick={() => void calculate()} aria-label="Рассчитать сценарий" title="Рассчитать сценарий"><Play size={20} fill="currentColor" /></button>
          <button type="button" onClick={reset} disabled={!selectedCount || submitting} aria-label="Сбросить сценарий" title="Сбросить сценарий"><RotateCcw size={19} /></button>
        </div>
      </header>

      {catalog?.event && <div className="event-banner" role="status"><span><strong>{catalog.event.title}</strong> · резерв {catalog.reservedBudget} из 100 · на меры доступно {budget} ед. · дополнительные синтетические условия</span><button onClick={() => setPanel('events')}>Условия события</button></div>}

      <div className="command__layout">
        <nav className="command__nav" aria-label="Разделы сценария">
          <button type="button" className={panel === 'map' ? 'is-active' : ''} aria-pressed={panel === 'map'} onClick={closePanel}><Map size={22} /><span>Карта</span></button>
          <button type="button" onClick={() => setPanel('indicators')} aria-pressed={panel === 'indicators'}><ChartNoAxesColumnIncreasing size={22} /><span>Показатели</span></button>
          <button type="button" onClick={() => setPanel('plan')} aria-pressed={panel === 'plan'}><ListChecks size={22} /><span>Решения</span>{selectedCount > 0 && <b>{selectedCount}</b>}</button>
          <button type="button" onClick={() => setPanel('analysis')} aria-pressed={panel === 'analysis'}><FileText size={22} /><span>AI-отчёт</span></button>
          <button type="button" onClick={() => setPanel('teams')} aria-pressed={panel === 'teams'}><Trophy size={22} /><span>Команды</span></button>
          <button type="button" onClick={() => setPanel('events')} aria-pressed={panel === 'events'}><Zap size={22} /><span>События</span></button>
          <button type="button" onClick={() => setPanel('presentation')} aria-pressed={panel === 'presentation'}><Presentation size={22} /><span>Презентация</span></button>
          <button type="button" onClick={() => setPanel('help')} className="command__nav-bottom" aria-pressed={panel === 'help'}><Settings size={22} /><span>Правила</span></button>
        </nav>
        <div className="command__body" aria-busy={loading || submitting}>
          {loading && <p className="command__message" role="status">Загружаем районы и мероприятия…</p>}
          {!catalog && !loading && <div className="command__load-error" role="alert"><p>{error}</p><button type="button" onClick={() => void refreshCatalog()}>Повторить загрузку</button></div>}
          {catalog && <>
            <div className="command__stage">
              <CityMap districts={catalog.districts} results={result?.districts} activeDistrict={activeDistrict} onSelect={setActiveDistrict}
                initiatives={mapInitiatives} focusedKey={inspected?.key ?? null}
                onInspect={(initiative) => { setFocusedInitiative(initiative.key); setActiveDistrict(initiative.district); }} />
              <aside className="mayor-card" aria-label="Ваша задача">
                <div className="mayor-card__portrait"><CharacterPortrait character="akim" alt="Аким — персонаж симулятора" /></div>
                <p><strong>Вы — аким Астаны.</strong>У вас 5 ключевых решений и ограниченный бюджет. Развивайте город, учитывайте потребности жителей и создавайте лучшее будущее!</p>
              </aside>
              <aside className="city-advisor" aria-label="Подсказка по сценарию">
                <div className="city-advisor__content"><div className="city-advisor__avatar"><CharacterPortrait key={advisor.character} character={advisor.character} alt={advisor.label} /></div>
                  <div><small>{advisor.label}</small><strong>{activeDistrict ? `В фокусе: ${activeDistrict}` : 'Каждое решение важно'}</strong><p>{tips[tipIndex]}</p></div>
                </div>
                <div className="city-advisor__controls">
                  <button type="button" onClick={() => setTipIndex((tipIndex + tips.length - 1) % tips.length)} aria-label="Предыдущий советник"><ChevronLeft size={18} /></button>
                  <div className="city-advisor__dots">{advisors.map((item, index) => <button key={item.character} type="button" className={tipIndex === index ? 'is-active' : ''} aria-label={item.label} aria-pressed={tipIndex === index} onClick={() => setTipIndex(index)} />)}</div>
                  <button type="button" onClick={() => setTipIndex((tipIndex + 1) % tips.length)} aria-label="Следующий советник"><ChevronRight size={18} /></button>
                </div>
              </aside>

              <aside className="initiative" aria-labelledby="initiative-heading">
                <div className="initiative__head"><h2 id="initiative-heading">Выберите инициативу</h2><span title="Число выбранных мер">{selectedCount}/5</span></div>
                <div className="initiative__tabs" aria-label="Направление мероприятий">
                  {categories.map((direction) => <button type="button" key={direction} className={direction === activeCategory ? 'is-active' : ''}
                    aria-pressed={direction === activeCategory} onClick={() => setActiveCategory(direction)}>{directionLabels[direction]}</button>)}
                </div>
                <div className="initiative__list">
                  {catalog.measures.filter((measure) => measure.direction === activeCategory).map((measure) => {
                    const isSelected = choices.some((choice) => choice.measureId === measure.id);
                    return <article className={`initiative__card${isSelected ? ' initiative__card--selected' : ''}`} key={measure.id}>
                      <InitiativeThumbnail measureId={measure.id} />
                      <div className="initiative__info"><strong>{measure.name}</strong><small>{measure.scope === 'Город' ? 'Все районы' : activeDistrict ?? 'Районная инициатива'}<br />Эффект через {measure.lagQuarters} кв.</small></div>
                      <div className="initiative__action"><strong>{measure.cost} <small>ед.</small></strong><button type="button"
                        disabled={submitting || isSelected || selectedCount === 5 || spent + measure.cost > budget} onClick={() => addMeasure(measure.id)}>
                        {isSelected ? <><Check size={13} /> В плане</> : spent + measure.cost > budget ? 'Нет бюджета' : 'Выбрать'}
                      </button>{isSelected && <button type="button" className="initiative__locate" onClick={() => {
                        const placement = mapInitiatives.find((item) => item.measure.id === measure.id && item.district === activeDistrict)
                          ?? mapInitiatives.find((item) => item.measure.id === measure.id);
                        if (placement) { setFocusedInitiative(placement.key); setActiveDistrict(placement.district); }
                        else setPanel('plan');
                      }}><MapPin size={11} /> На карте</button>}</div>
                    </article>;
                  })}
                </div>
                <button type="button" className="initiative__plan" onClick={() => setPanel('plan')}><ListChecks size={16} /> План города <span>{selectedCount} / 5</span><ArrowRight size={16} /></button>
              </aside>

              <div className={`scenario-card${inspected ? ' scenario-card--initiative' : ''}`}>
                {inspected ? <>
                  <button type="button" className="scenario-card__close" aria-label="Закрыть карточку инициативы" onClick={() => setFocusedInitiative(null)}><X size={15} /></button>
                  <div className="scenario-card__heading"><InitiativeThumbnail key={inspected.measure.id} measureId={inspected.measure.id} />
                    <div><strong>{inspected.measure.name}</strong><small>{inspected.measure.scope === 'Город' ? `Весь город · участок в районе ${inspected.district}` : inspected.district}</small></div>
                  </div>
                  <span className="scenario-card__planned"><Check size={12} /> В плане · {inspected.measure.id}</span>
                  <dl className="scenario-card__facts"><div><dt>Стоимость меры</dt><dd>{inspected.measure.cost} ед.</dd></div><div><dt>Начало эффекта</dt><dd>Через {inspected.measure.lagQuarters} кв.</dd></div></dl>
                  <p>Подсвечен условный участок{inspected.measure.scope === 'Город' ? ' в каждом районе' : ' в выбранном районе'}. Эффект появится после расчёта сценария.</p>
                  <button type="button" className="scenario-card__edit" onClick={() => setPanel('plan')}>Изменить план<ArrowUpRight size={16} /></button>
                </> : <>
                <div className="scenario-card__heading"><div className="scenario-card__icon"><ListChecks size={23} /></div><div><strong>Ваш план развития</strong><small>{activeDistrict ?? 'Все районы'} · горизонт 8 кварталов</small></div></div>
                <div className="scenario-card__progress"><span>Выбрано инициатив</span><b>{selectedCount} из 5</b></div>
                <div className="scenario-card__track" aria-hidden="true"><span style={{ width: `${selectedCount * 20}%` }} /></div>
                <p>{result ? `Сценарий рассчитан. Остаток бюджета: ${result.remaining} ед.` : 'Распределите бюджет между пятью инициативами.'}</p>
                <button type="button" onClick={() => setPanel(result ? 'analysis' : 'plan')}>{result ? 'Открыть AI-отчёт' : 'Перейти к решениям'}<ArrowUpRight size={16} /></button>
                </>}
              </div>
            </div>
            <ScenarioDashboard catalog={catalog} result={result} />
          </>}
        </div>
      </div>
      <footer className="command__footer"><strong>ASTANA CITYLAB</strong><span>Вместе создаём город, в котором хочется жить.</span><small>Синтетическая модель · SKYNOMADS</small></footer>

      {catalog && <>
        <dialog className="sim-panel plan" id="panel-plan" aria-labelledby="plan-heading" {...dialogProps}>
          {closeButton}
          <header className="sim-panel__header"><span className="sim-panel__eyebrow">ВАШИ РЕШЕНИЯ</span><h2 id="plan-heading">План города</h2><p>Пять разных мер · не больше двух в одном направлении.</p></header>
          {catalog.event && <p className="conditions-note">{catalog.event.title}: резерв {catalog.reservedBudget} ед., на план доступно {budget}. {spent > budget ? 'Текущий набор больше не помещается в бюджет — замените меры.' : 'Проверьте районы и перераспределение средств.'}</p>}
          <button type="button" className="plan__example" disabled={submitting} onClick={() => {
            setChoices((catalog.event ? EVENT_EXAMPLE : EXAMPLE).map((item) => ({ ...item }))); setActiveDistrict('Нура'); setResult(null); setError('');
            setFocusedInitiative('M7:Нура');
          }}>Загрузить демо-набор <ArrowRight size={16} /></button>
          <form onSubmit={(event) => { event.preventDefault(); void calculate(); }}>
            {error && <p className="sim-panel__error" role="alert">{error}</p>}
            <fieldset disabled={submitting} className="plan__slots">
              <legend className="sr-only">Пять инициатив</legend>
              {choices.map((choice, index) => {
                const measure = catalog.measures.find((item) => item.id === choice.measureId);
                return <div className={`plan__slot${measure ? ' plan__slot--filled' : ''}`} key={index}>
                  <span className="plan__index">0{index + 1}</span><div className="plan__measure"><strong>{measure?.name ?? 'Свободное решение'}</strong><small>{measure ? `${measure.direction} · ${measure.cost} ед.` : 'Добавьте инициативу из каталога'}</small></div>
                  {measure?.scope === 'Район' && <label className="plan__district"><span>Район</span><select value={choice.district ?? ''} onChange={(event) => updateChoice(index, { ...choice, district: event.target.value })}><option value="">Выберите район</option>{catalog.districts.map((district) => <option key={district.name} value={district.name}>{district.name}</option>)}</select></label>}
                  {measure?.scope === 'Город' && <span className="plan__city"><Map size={15} /> Весь город</span>}
                  {measure && <button type="button" className="plan__remove" aria-label={`Убрать ${measure.name}`} onClick={() => updateChoice(index, { measureId: '', district: null })}><X size={17} /></button>}
                </div>;
              })}
            </fieldset>
            <div className="plan__footer"><div><span>Расход бюджета</span><strong className={spent > budget ? 'is-negative' : ''}>{spent} / {budget} ед.</strong>{spent > budget && <small role="alert">Превышение на {spent - budget} ед.</small>}</div>
              <button type="submit" className="primary-button" disabled={submitting || spent > budget}>{submitting ? 'Получаем AI-анализ…' : 'Рассчитать результат'}<ArrowRight size={17} /></button></div>
          </form>
        </dialog>
        <dialog className="sim-panel analysis-panel" id="panel-analysis" aria-labelledby="analysis-heading" {...dialogProps}>
          {closeButton}<header className="sim-panel__header"><span className="sim-panel__eyebrow"><Sparkles size={16} /> OPENAI · АНАЛИЗ СЦЕНАРИЯ</span><h2 id="analysis-heading">Эффект ваших решений</h2></header>
          {result ? <><div className="analysis-panel__summary"><div><small>Quality of Life Score</small><strong>{result.score.toFixed(2)}</strong></div><div><small>Стоимость</small><strong>{result.cost} <em>ед.</em></strong></div><div><small>Остаток</small><strong>{result.remaining} <em>ед.</em></strong></div></div>
            {result.analysis ? <div className="analysis-panel__text"><ReactMarkdown>{result.analysis}</ReactMarkdown></div> : <p className="sim-panel__error" role="alert">{result.analysisError}</p>}
            <p className="analysis-panel__footnote">Критических показателей: {result.criticalPairs} · Синергии: {result.synergies.join(', ') || 'нет'}</p>
            <div className="extension-actions"><button className="extension-secondary" onClick={() => setPanel('teams')}>Сохранить для сравнения</button><button className="extension-secondary" onClick={() => setPanel('presentation')}>Создать презентацию</button></div>
            <Recommendations catalog={catalog} decisions={choices} result={result} busy={submitting} setBusy={setSubmitting} onApply={applyRecommendation} /></>
            : <div className="sim-panel__empty"><Sparkles size={36} /><h3>Сначала выберите пять решений</h3><p>Рассчитаем их влияние и объясним сильные стороны, риски и компромиссы.</p><button className="primary-button" onClick={() => setPanel('plan')}>Открыть план <ArrowRight size={16} /></button></div>}
        </dialog>
        <dialog className="sim-panel indicators-panel" id="panel-indicators" aria-labelledby="indicators-heading" {...dialogProps}>
          {closeButton}<header className="sim-panel__header"><span className="sim-panel__eyebrow">ПЯТЬ РАЙОНОВ · ДЕСЯТЬ ПОКАЗАТЕЛЕЙ</span><h2 id="indicators-heading">Показатели города</h2><p>{result ? 'После выбранных решений.' : 'Исходное состояние.'} Шкала 0–100: больше — лучше.</p></header>
          <DistrictChanges catalog={catalog} result={result} districtName={activeDistrict} onDistrict={setActiveDistrict} />
          <div className="indicators-panel__table"><table><thead><tr><th>Показатель</th>{catalog.districts.map((district) => <th key={district.name}>{district.name}</th>)}</tr></thead><tbody>{catalog.indicators.map((indicator) => <tr key={indicator.code}><th>{indicator.name}</th>{catalog.districts.map((district) => {
            const change = result?.districts.find((item) => item.name === district.name)?.changes[indicator.code] ?? 0;
            const value = district.indicators[indicator.code] + change;
            return <td key={district.name} className={value < 40 ? 'is-negative' : ''}>{value.toFixed(1)}</td>;
          })}</tr>)}</tbody></table></div>
        </dialog>
        <dialog className="sim-panel extension-panel" id="panel-teams" aria-labelledby="teams-heading" {...dialogProps}>
          {closeButton}<header className="sim-panel__header"><span className="sim-panel__eyebrow">ОБЩИЙ РЕЙТИНГ</span><h2 id="teams-heading">Сравнение команд</h2></header>
          <TeamComparison catalog={catalog} decisions={choices} result={result} teamName={teamName} setTeamName={setTeamName} busy={submitting} setBusy={setSubmitting} open={panel === 'teams'} />
        </dialog>
        <dialog className="sim-panel extension-panel" id="panel-events" aria-labelledby="events-heading" {...dialogProps}>
          {closeButton}<header className="sim-panel__header"><span className="sim-panel__eyebrow">ГОРОД МЕНЯЕТСЯ</span><h2 id="events-heading">Неожиданные события</h2></header>
          {error && <p className="sim-panel__error" role="alert">{error}</p>}
          <EventPanel catalog={catalog} busy={submitting} onActivate={changeEvent} />
        </dialog>
        <dialog className="sim-panel extension-panel" id="panel-presentation" aria-labelledby="presentation-heading" {...dialogProps}>
          {closeButton}<header className="sim-panel__header"><span className="sim-panel__eyebrow">ПРЕЗЕНТАЦИЯ КОМАНДЫ</span><h2 id="presentation-heading">Пять слайдов о вашем решении</h2></header>
          <PresentationPanel catalog={catalog} decisions={choices} result={result} teamName={teamName} setTeamName={setTeamName} busy={submitting} setBusy={setSubmitting} />
        </dialog>
        <dialog className="sim-panel help-panel" id="panel-help" aria-labelledby="help-heading" {...dialogProps}>
          {closeButton}<header className="sim-panel__header"><span className="sim-panel__eyebrow"><CircleHelp size={16} /> КАК ИГРАТЬ</span><h2 id="help-heading">Пять решений для города</h2></header>
          <ol><li>Выберите район на карте и инициативу в каталоге.</li><li>Соберите пять разных мер: максимум две из одного направления.</li><li>Уложитесь в бюджет 100 условных единиц.</li><li>Откройте «Решения», проверьте районы и рассчитайте результат.</li></ol>
          <p><Info size={16} /> Карта — условный 3D-макет. Все показатели синтетические, это не прогноз для реальной Астаны.</p>
          <p>Вращайте карту перетаскиванием; приближайте колёсиком. Для клавиатуры доступны все кнопки районов.</p>
          <p>Выбранные инициативы подсвечивают условные участки. Районные — только в назначенном районе, городские — во всех пяти. Нажмите на значок меры или «На карте», чтобы увидеть её карточку; это отметки плана, а не завершённого строительства.</p>
          <p>«Команды» сохраняет рассчитанные наборы на общем сервере и сравнивает одинаковые условия. «События» резервирует часть бюджета и меняет стартовые показатели. В AI-отчёте можно получить проверенное улучшение одной заменой, а в «Презентации» — скачать PPTX.</p>
        </dialog>
      </>}
    </main>
  );
};

export default Home;
