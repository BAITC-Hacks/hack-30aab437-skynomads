import React, { useEffect, useRef, useState } from 'react';
import { Building2, Globe2, MapPin } from 'lucide-react';
import type { Catalog, Scenario } from './api';
import { createCityScene } from './cityScene';
import type { CitySceneController } from './cityScene';
import { initiativeColors } from './mapInitiatives';
import type { MapInitiative } from './mapInitiatives';

interface CityMapProps {
  districts: Catalog['districts'];
  results?: Scenario['districts'];
  activeDistrict: string | null;
  onSelect: (name: string) => void;
  initiatives: MapInitiative[];
  focusedKey: string | null;
  onInspect: (initiative: MapInitiative) => void;
}

export const CityMap = ({ districts, results, activeDistrict, onSelect, initiatives, focusedKey, onInspect }: CityMapProps) => {
  const host = useRef<HTMLDivElement>(null);
  const markers = useRef(new Map<string, HTMLButtonElement>());
  const initiativeMarkers = useRef(new Map<string, HTMLButtonElement>());
  const initiativeLinks = useRef(new Map<string, SVGLineElement>());
  const scene = useRef<CitySceneController | null>(null);
  const [failed, setFailed] = useState(false);
  const active = districts.find((district) => district.name === activeDistrict);
  const activeResult = results?.find((district) => district.name === activeDistrict);

  useEffect(() => {
    if (!host.current) return;
    try {
      const controller = createCityScene(host.current, markers.current, { markers: initiativeMarkers.current, links: initiativeLinks.current });
      scene.current = controller;
      return () => { scene.current = null; controller.dispose(); };
    } catch {
      setFailed(true);
    }
  }, []);
  useEffect(() => { scene.current?.updateInitiatives(initiatives, focusedKey); }, [initiatives, focusedKey]);
  useEffect(() => { scene.current?.render(); }, [results]);

  return (
    <section className={`city-map${failed ? ' city-map--fallback' : ''}`} id="map" aria-label="Трёхмерная модель города">
      <div className="city-map__canvas" ref={host} aria-label="Вращение города — перетаскиванием, масштаб — колёсиком" />
      <div className="city-map__topline">
        <span className="map-kicker"><span className="map-kicker__dot" /> 3D ГОРОД / УСЛОВНАЯ МОДЕЛЬ</span>
        <span>{failed ? 'WebGL недоступен: выберите район из списка' : 'Перетащите для вращения · Колёсико для масштаба'}</span>
      </div>
      {districts.map((district) => {
        const outcome = results?.find((item) => item.name === district.name);
        const assigned = initiatives.filter((initiative) => initiative.district === district.name);
        return (
          <button key={district.name} type="button"
            ref={(element) => { if (element) markers.current.set(district.name, element); else markers.current.delete(district.name); }}
            className={`city-map__marker${district.name === activeDistrict ? ' city-map__marker--active' : ''}`}
            aria-pressed={district.name === activeDistrict}
            data-district={district.name}
            data-planned-count={assigned.length}
            onClick={() => onSelect(district.name)}>
            <strong>{district.name.toUpperCase()}</strong>
            <span>QoL {(outcome?.score ?? district.baselineDistrictScore).toFixed(2)}</span>
            {outcome && <small className={outcome.delta >= 0 ? 'is-positive' : 'is-negative'}>
              {outcome.delta >= 0 ? '+' : ''}{outcome.delta.toFixed(2)}
            </small>}
            {assigned.length > 0 && <em className="city-map__planned"><MapPin size={11} /> {assigned.length} в плане</em>}
          </button>
        );
      })}
      <div className="city-map__initiative-layer" aria-label="Выбранные инициативы на карте">
        <svg className="city-map__connections" width="100%" height="100%" aria-hidden="true">
          {initiatives.map((initiative) => <line key={initiative.key}
            ref={(element) => { if (element) initiativeLinks.current.set(initiative.key, element); else initiativeLinks.current.delete(initiative.key); }}
            stroke={focusedKey === initiative.key ? '#8ac6ff' : initiativeColors[initiative.measure.direction]}
            strokeWidth="1.2" opacity=".8" />)}
        </svg>
        {initiatives.map((initiative) => (
          <button key={initiative.key} type="button"
            ref={(element) => { if (element) initiativeMarkers.current.set(initiative.key, element); else initiativeMarkers.current.delete(initiative.key); }}
            className={`map-pin${focusedKey === initiative.key ? ' map-pin--focused' : ''}`}
            style={{ '--initiative-color': focusedKey === initiative.key ? '#8ac6ff' : initiativeColors[initiative.measure.direction] ?? '#559bff' } as React.CSSProperties}
            data-placement={initiative.key}
            data-measure-id={initiative.measure.id}
            data-district={initiative.district}
            aria-pressed={focusedKey === initiative.key}
            aria-label={`${initiative.measure.name} — ${initiative.district}${initiative.measure.scope === 'Город' ? ' (городская мера)' : ''}, в плане`}
            title={`${initiative.measure.name} · ${initiative.district} · В плане`}
            onClick={() => onInspect(initiative)}>
            {initiative.measure.scope === 'Город' ? <Globe2 size={16} /> : <Building2 size={16} />}
            <span>{initiative.measure.id}</span>
          </button>
        ))}
      </div>
      {failed && <p className="city-map__fallback-notice" role="status">3D недоступен. Инициативы и районы доступны в списке ниже.</p>}
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
