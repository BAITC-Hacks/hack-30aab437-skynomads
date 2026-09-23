import React, { useEffect, useRef, useState } from 'react';
import type { Catalog, Scenario } from './api';
import { createCityScene } from './cityScene';

interface CityMapProps {
  districts: Catalog['districts'];
  results?: Scenario['districts'];
  activeDistrict: string | null;
  onSelect: (name: string) => void;
}

export const CityMap = ({ districts, results, activeDistrict, onSelect }: CityMapProps) => {
  const host = useRef<HTMLDivElement>(null);
  const markers = useRef(new Map<string, HTMLButtonElement>());
  const [failed, setFailed] = useState(false);
  const active = districts.find((district) => district.name === activeDistrict);
  const activeResult = results?.find((district) => district.name === activeDistrict);

  useEffect(() => {
    if (!host.current) return;
    try {
      return createCityScene(host.current, markers.current);
    } catch {
      setFailed(true);
    }
  }, []);

  return (
    <section className={`city-map${failed ? ' city-map--fallback' : ''}`} id="map" aria-label="Трёхмерная модель города">
      <div className="city-map__canvas" ref={host} aria-label="Вращение города — перетаскиванием, масштаб — колёсиком" />
      <div className="city-map__topline">
        <span className="map-kicker"><span className="map-kicker__dot" /> 3D ГОРОД / УСЛОВНАЯ МОДЕЛЬ</span>
        <span>{failed ? 'WebGL недоступен: выберите район из списка' : 'Перетащите для вращения · Колёсико для масштаба'}</span>
      </div>
      {districts.map((district) => {
        const outcome = results?.find((item) => item.name === district.name);
        return (
          <button key={district.name} type="button"
            ref={(element) => { if (element) markers.current.set(district.name, element); else markers.current.delete(district.name); }}
            className={`city-map__marker${district.name === activeDistrict ? ' city-map__marker--active' : ''}`}
            aria-pressed={district.name === activeDistrict}
            onClick={() => onSelect(district.name)}>
            <strong>{district.name.toUpperCase()}</strong>
            <span>QoL {(outcome?.score ?? district.baselineDistrictScore).toFixed(2)}</span>
            {outcome && <small className={outcome.delta >= 0 ? 'is-positive' : 'is-negative'}>
              {outcome.delta >= 0 ? '+' : ''}{outcome.delta.toFixed(2)}
            </small>}
          </button>
        );
      })}
      <div className="city-map__bottomline">
        <div className="city-map__selection">
          <span>В ФОКУСЕ</span><strong>{active?.name ?? 'Все районы'}</strong>
          <small>{active ? `Балл района: ${(activeResult?.score ?? active.baselineDistrictScore).toFixed(2)}` : 'Пять условных районов города'}</small>
        </div>
        <span className="city-map__legend"><i /> Выберите район для добавления инициатив</span>
      </div>
    </section>
  );
};
