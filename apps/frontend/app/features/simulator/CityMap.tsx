import React, { useEffect, useRef, useState } from 'react';
import type { Catalog } from './api';
import type { CityScene, SceneState } from './cityScene';

interface Props extends SceneState {
  catalog: Catalog;
  onSelect: (district: string | null) => void;
}

export const CityMap = ({ catalog, onSelect, ...state }: Props) => {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<CityScene | null>(null);
  const latest = useRef(state);
  const select = useRef(onSelect);
  const [error, setError] = useState('');
  latest.current = state;
  select.current = onSelect;

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    import('./cityScene').then(({ CityScene }) => CityScene.create(element, catalog, (name) => select.current(name)))
      .then((next) => { if (disposed) next.destroy(); else { scene.current = next; next.update(latest.current); } })
      .catch(() => { if (!disposed) setError('Карта недоступна: проверьте поддержку WebGL в браузере.'); });
    return () => { disposed = true; scene.current?.destroy(); scene.current = null; };
  }, [catalog]);

  useEffect(() => { scene.current?.update(state); }, [state.choices, state.selected, state.layer, state.result, state.finished, state.quarter, state.running]);

  return <div className="city-map">
    <div className="city-map__canvas" ref={host} aria-label="Изометрическая карта пяти районов Астаны" />
    {error && <div className="city-map__error" role="alert">{error}</div>}
    <div className="city-map__keyboard">{catalog.districts.map((district) => <button key={district.name} type="button" onClick={() => onSelect(district.name)}>Район {district.name}</button>)}</div>
    <div className="city-map__controls"><button type="button" aria-label="Приблизить" onClick={() => scene.current?.zoom(.2)}>+</button><button type="button" aria-label="Отдалить" onClick={() => scene.current?.zoom(-.2)}>−</button><button type="button" aria-label="Показать весь город" aria-pressed={!state.selected} onClick={() => { scene.current?.reset(); onSelect(null); }}>⌖</button></div>
    {state.quarter > 0 && <div className="city-map__quarter">{state.finished ? 'Сценарий завершён' : `Q${state.quarter} / 8${state.quarter === 8 ? ' · расчёт' : ''}`}</div>}
  </div>;
};
