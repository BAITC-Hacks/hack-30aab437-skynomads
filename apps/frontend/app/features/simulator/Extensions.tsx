import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowRight, Download, RefreshCw, Sparkles, Trophy, Zap } from 'lucide-react';
import { downloadPresentation, drawEvent, loadEvents, loadTeams, requestRecommendation, saveTeam } from './api';
import type { Catalog, CityEvent, Decision, Recommendation, Scenario, TeamResult } from './api';
import './Extensions.scss';

interface PlanProps {
  catalog: Catalog;
  result: Scenario | null;
  decisions: Decision[];
  busy: boolean;
  setBusy: (value: boolean) => void;
}
interface NamedPlan extends PlanProps {
  teamName: string;
  setTeamName: (value: string) => void;
}
const message = (error: unknown) => error instanceof Error ? error.message : 'Операция не удалась. Попробуйте ещё раз.';
const signed = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;

const TeamName = ({ teamName, setTeamName, busy }: Pick<NamedPlan, 'teamName' | 'setTeamName' | 'busy'>) => (
  <label className="extension-field">Название команды
    <input maxLength={60} value={teamName} onChange={(event) => setTeamName(event.target.value)} disabled={busy} placeholder="Например, SKYNOMADS" />
  </label>
);

export const DistrictChanges = ({ catalog, result, districtName, onDistrict }: {
  catalog: Catalog; result: Scenario | null; districtName: string | null; onDistrict: (value: string) => void;
}) => {
  const district = catalog.districts.find((item) => item.name === districtName) ?? catalog.districts[0];
  const after = result?.districts.find((item) => item.name === district.name);
  return <section className="district-changes" aria-label="Изменения показателей района">
    <label className="extension-field">Район<select value={district.name} onChange={(event) => onDistrict(event.target.value)}>
      {catalog.districts.map((item) => <option key={item.name}>{item.name}</option>)}
    </select></label>
    <p className="extension-muted">Серый — до решений в активных условиях. Зелёный — после. Критический порог: строго ниже 40.</p>
    {!result && <p role="status">Сначала рассчитайте план, чтобы увидеть его влияние.</p>}
    <div className="district-change-list">{catalog.indicators.map((indicator) => {
      const before = district.indicators[indicator.code];
      const value = after?.indicators[indicator.code] ?? before;
      return <div className="district-change" key={indicator.code}>
        <div className="district-change__label"><span>{indicator.code} · {indicator.name}</span><strong className={value < 40 ? 'is-negative' : ''}>{before.toFixed(1)} → {value.toFixed(1)} <small>({signed(value - before)})</small></strong></div>
        <div className="district-change__bars" role="img" aria-label={`${indicator.name}: до ${before.toFixed(1)}, после ${value.toFixed(1)}, изменение ${signed(value - before)}`}>
          <i className="district-change__before" style={{ width: `${before}%` }} />
          <i className={`district-change__after${value < 40 ? ' is-critical' : ''}`} style={{ width: `${value}%` }} />
          <b className="district-change__threshold" />
        </div>
      </div>;
    })}</div>
  </section>;
};

export const TeamComparison = (props: NamedPlan & { open: boolean }) => {
  const { catalog, result, decisions, teamName, busy, setBusy } = props;
  const [teams, setTeams] = useState<TeamResult[]>([]);
  const [filter, setFilter] = useState(catalog.event?.id ?? '');
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const requestVersion = useRef(0);
  const refresh = async () => {
    const version = ++requestVersion.current;
    setLoading(true); setError('');
    try { const data = await loadTeams(); if (requestVersion.current === version) setTeams(data); }
    catch (cause) { if (requestVersion.current === version) setError(message(cause)); }
    finally { if (requestVersion.current === version) setLoading(false); }
  };
  useEffect(() => { if (props.open) { setFilter(catalog.event?.id ?? ''); setSelected([]); void refresh(); } }, [props.open, catalog.event?.id]);
  const save = async () => {
    if (busy || !result) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await saveTeam(teamName, decisions, catalog.event?.id);
      setFilter(catalog.event?.id ?? ''); setSelected([]);
      await refresh(); setNotice('Результат сохранён на сервере и доступен другим командам.');
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  };
  const groups = new Map<string, string>([['', 'Базовые условия'], ...teams.map((team): [string, string] => [team.eventId ?? '', team.result.event?.title ?? 'Базовые условия'])]);
  if (catalog.event) groups.set(catalog.event.id, catalog.event.title);
  const ranked = teams.filter((team) => (team.eventId ?? '') === filter).sort((a, b) => b.result.score - a.result.score || a.createdAt.localeCompare(b.createdAt));
  const compare = ranked.filter((team) => selected.includes(team.id));
  return <div className="extension-content">
    <TeamName {...props} />
    <div className="extension-actions"><button type="button" className="primary-button" disabled={busy || !result || !teamName.trim()} onClick={() => void save()}><Trophy size={16} />{busy ? 'Сохраняем…' : 'Сохранить результат команды'}</button><button type="button" className="extension-secondary" disabled={loading || busy} onClick={() => void refresh()}><RefreshCw size={16} />Обновить</button></div>
    {!result && <p className="extension-muted">Для сохранения сначала рассчитайте актуальный план.</p>}
    {error && <p className="sim-panel__error" role="alert">{error}</p>}{notice && <p role="status" className="extension-success">{notice}</p>}
    <label className="extension-field">Условия сравнения<select value={filter} onChange={(event) => { setFilter(event.target.value); setSelected([]); }}>{[...groups].map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label>
    <p className="extension-muted">Сравниваются одинаковые условия. Выберите две отправки для сравнения по районам. Хранятся последние 100 результатов; названия команд — свободные подписи.</p>
    {loading ? <p role="status">Загружаем результаты…</p> : ranked.length === 0 ? <p className="extension-empty">В этих условиях ещё нет результатов. Сохраните первый план команды.</p> :
      <div className="extension-table"><table><thead><tr><th>Выбор</th><th>Место</th><th>Команда</th><th>Score</th><th>Прирост</th><th>Расход</th></tr></thead><tbody>{ranked.map((team) => <tr key={team.id}>
        <td><input type="checkbox" aria-label={`Сравнить ${team.teamName}, ${team.createdAt}`} checked={selected.includes(team.id)} disabled={!selected.includes(team.id) && selected.length === 2} onChange={() => setSelected((current) => current.includes(team.id) ? current.filter((id) => id !== team.id) : [...current, team.id])} /></td>
        <td>{ranked.findIndex((item) => item.result.score === team.result.score) + 1}</td><th>{team.teamName}<small>{new Date(team.createdAt).toLocaleString('ru-RU')}</small></th><td><strong>{team.result.score.toFixed(2)}</strong></td><td>{signed(team.result.score - team.result.baselineScore)}</td><td>{team.result.cost} / {team.result.budget}</td>
      </tr>)}</tbody></table></div>}
    {compare.length === 2 && <div className="team-detail"><h3>Районы: {compare[0].teamName} / {compare[1].teamName}</h3>{compare[0].result.districts.map((district) => {
      const other = compare[1].result.districts.find((item) => item.name === district.name)!;
      return <div className="team-detail__row" key={district.name}><strong>{district.name}</strong><span>{district.score.toFixed(2)} / {other.score.toFixed(2)}</span><div><i style={{ width: `${district.score}%` }} /><b style={{ width: `${other.score}%` }} /></div></div>;
    })}<p>Критические показатели: {compare[0].result.criticalPairs} / {compare[1].result.criticalPairs}</p></div>}
  </div>;
};

export const Recommendations = ({ catalog, decisions, busy, setBusy, onApply }: PlanProps & { onApply: (decisions: Decision[]) => void }) => {
  const [suggestion, setSuggestion] = useState<Recommendation | null>(null);
  const [error, setError] = useState('');
  const request = async () => {
    if (busy) return;
    setBusy(true); setError(''); setSuggestion(null);
    try { setSuggestion(await requestRecommendation(decisions, catalog.event?.id)); }
    catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  };
  return <section className="recommendations"><h3><Sparkles size={18} /> Как улучшить этот план</h3>
    <p className="extension-muted">Проверим замены одной меры или района. AI объяснит лучший найденный допустимый вариант; это не поиск глобального оптимума.</p>
    <button type="button" className="extension-secondary" disabled={busy} onClick={() => void request()}>{busy ? 'Проверяем варианты…' : 'Получить AI-рекомендацию'}</button>
    {error && <p className="sim-panel__error" role="alert">{error}</p>}
    {suggestion && !suggestion.candidate && <p className="extension-empty" role="status">Одной заменой повысить Score не удалось. Можно попробовать изменить несколько решений.</p>}
    {suggestion?.candidate && <div className="recommendation-card">
      <strong>{suggestion.original.score.toFixed(2)} → {suggestion.candidate.result.score.toFixed(2)} <span className="is-positive">({signed(suggestion.candidate.result.score - suggestion.original.score)})</span></strong>
      <p>Расход: {suggestion.candidate.result.cost} / {suggestion.candidate.result.budget}. Критических показателей: {suggestion.candidate.result.criticalPairs}.</p>
      <ul>{suggestion.candidate.decisions.map((choice, index) => <li key={choice.measureId} className={index === suggestion.candidate!.changedIndex ? 'is-positive' : ''}>{catalog.measures.find((item) => item.id === choice.measureId)?.name} · {choice.district ?? 'Весь город'}{index === suggestion.candidate!.changedIndex ? ' — изменение' : ''}</li>)}</ul>
      {suggestion.explanation ? <ReactMarkdown>{suggestion.explanation}</ReactMarkdown> : <p className="sim-panel__error">Расчётное улучшение найдено. {suggestion.analysisError}</p>}
      <button type="button" className="primary-button" disabled={busy} onClick={() => onApply(suggestion.candidate!.decisions)}>Применить предложенный план <ArrowRight size={16} /></button>
    </div>}
  </section>;
};

export const EventPanel = ({ catalog, busy, onActivate }: { catalog: Catalog; busy: boolean; onActivate: (id: string | null) => Promise<void> }) => {
  const [events, setEvents] = useState<CityEvent[]>([]);
  const [error, setError] = useState('');
  const [drawing, setDrawing] = useState(false);
  const refresh = async () => { try { setEvents(await loadEvents()); setError(''); } catch (cause) { setError(message(cause)); } };
  useEffect(() => { void refresh(); }, []);
  const surprise = async () => {
    setDrawing(true); setError('');
    try { const event = await drawEvent(); await onActivate(event.id); }
    catch (cause) { setError(message(cause)); }
    finally { setDrawing(false); }
  };
  return <div className="extension-content">
    <p className="extension-muted">Дополнительные синтетические события. Одновременно активно одно событие. Резерв уменьшает бюджет пяти решений; сохранённые результаты сравниваются только в одинаковых условиях.</p>
    {error && <p className="sim-panel__error" role="alert">{error}<button className="extension-secondary" onClick={() => void refresh()}>Повторить загрузку</button></p>}
    <div className="extension-actions"><button type="button" className="primary-button" disabled={busy || drawing || !events.length} onClick={() => void surprise()}><Zap size={17} />{drawing ? 'Событие происходит…' : 'Неожиданное событие'}</button><button type="button" className="extension-secondary" disabled={busy || drawing || !catalog.event} onClick={() => void onActivate(null)}>Вернуться к базовым условиям</button></div>
    <div className="event-list">{events.map((event) => <article className={`event-card${catalog.event?.id === event.id ? ' is-active' : ''}`} key={event.id}>
      <div><h3>{event.title}</h3><span>Резерв {event.reserve} ед. · доступно {100 - event.reserve}</span></div><p>{event.description}</p>
      <ul>{event.shocks.map((shock, index) => <li key={index}>{shock.district ?? 'Все районы'}: {Object.entries(shock.effects).map(([code, value]) => `${catalog.indicators.find((item) => item.code === code)?.name ?? code} ${value}`).join('; ')}</li>)}</ul>
      <button type="button" className="extension-secondary" disabled={busy || drawing || catalog.event?.id === event.id} onClick={() => void onActivate(event.id)}>{catalog.event?.id === event.id ? 'Активно' : 'Активировать событие'}</button>
    </article>)}</div>
  </div>;
};

export const PresentationPanel = (props: NamedPlan) => {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const download = async () => {
    if (props.busy || !props.result) return;
    props.setBusy(true); setError(''); setNotice('');
    try {
      const ai = await downloadPresentation(props.teamName, props.decisions, props.catalog.event?.id);
      setNotice(ai ? 'Презентация из пяти слайдов сформирована и скачана.' : 'Презентация скачана. На последнем слайде отмечено, что AI-разбор недоступен.');
    } catch (cause) { setError(message(cause)); }
    finally { props.setBusy(false); }
  };
  return <div className="extension-content">
    <TeamName {...props} />
    <ol className="slide-outline"><li>Команда, условия и итоговый Score</li><li>Пять решений, районы и расходы</li><li>Диаграммы районов до и после</li><li>Синергии, критические показатели и формула</li><li>Реальное AI-объяснение решения</li></ol>
    {props.result ? <p>В презентации: {props.result.score.toFixed(2)} Score, {props.result.cost} / {props.result.budget} ед., {props.catalog.event?.title ?? 'базовые условия'}.</p> : <p className="extension-empty">Сначала рассчитайте план. Презентация будет сформирована по актуальному результату.</p>}
    <button type="button" className="primary-button" disabled={props.busy || !props.result || !props.teamName.trim()} onClick={() => void download()}><Download size={17} />{props.busy ? 'Собираем слайды…' : 'Скачать презентацию PPTX'}</button>
    {error && <p className="sim-panel__error" role="alert">{error}</p>}{notice && <p className="extension-success" role="status">{notice}</p>}
    <p className="extension-muted">Открывается в PowerPoint, Keynote или LibreOffice. Числа сервер пересчитывает перед экспортом. При недоступном AI сохраняются факты и явная отметка.</p>
  </div>;
};
