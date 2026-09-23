import React from 'react';
import type { Catalog, Scenario } from './api';

interface CityMapProps {
  districts: Catalog['districts'];
  results?: Scenario['districts'];
  activeDistrict: string | null;
  onSelect: (name: string) => void;
}

const positions: Record<string, { left: string; top: string }> = {
  Есиль: { left: '58%', top: '23%' },
  Алматы: { left: '78%', top: '52%' },
  Сарыарка: { left: '24%', top: '34%' },
  Байконур: { left: '22%', top: '73%' },
  Нура: { left: '58%', top: '72%' },
};

export const CityMap = ({ districts, results, activeDistrict, onSelect }: CityMapProps) => {
  const active = districts.find((district) => district.name === activeDistrict);
  const activeResult = results?.find((district) => district.name === activeDistrict);

  return (
    <section className="city-map" id="map" aria-label="Схема условных районов">
      <svg className="city-map__art" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <pattern id="blocks" width="96" height="78" patternUnits="userSpaceOnUse" patternTransform="rotate(-13)">
            <path d="M0 0H96 M0 0V78" stroke="#35556b" strokeWidth="8" opacity=".55" />
            <rect x="13" y="13" width="30" height="24" rx="2" fill="#3d5867" />
            <rect x="51" y="13" width="32" height="28" rx="2" fill="#61747a" />
            <rect x="15" y="44" width="21" height="24" rx="2" fill="#4d6b6b" />
            <rect x="45" y="49" width="36" height="18" rx="2" fill="#506774" />
          </pattern>
          <linearGradient id="terrain" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#132b39" /><stop offset=".55" stopColor="#2c4851" /><stop offset="1" stopColor="#162b3a" />
          </linearGradient>
          <radialGradient id="cityGlow"><stop stopColor="#b3d485" stopOpacity=".32" /><stop offset="1" stopColor="#b3d485" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="1000" height="620" fill="url(#terrain)" />
        <rect width="1000" height="620" fill="url(#blocks)" opacity=".9" />
        <path d="M-80 370 C170 280 220 490 500 410 S810 330 1080 440" fill="none" stroke="#0b263a" strokeWidth="120" />
        <path d="M-80 370 C170 280 220 490 500 410 S810 330 1080 440" fill="none" stroke="#347294" strokeWidth="93" opacity=".85" />
        <path d="M-80 370 C170 280 220 490 500 410 S810 330 1080 440" fill="none" stroke="#88c5cf" strokeWidth="2" opacity=".65" />
        <path d="M70 -80 L415 700 M670 -80 L910 700 M-30 210 L1030 135 M-30 555 L1030 520" fill="none" stroke="#15242c" strokeWidth="34" />
        <path d="M70 -80 L415 700 M670 -80 L910 700 M-30 210 L1030 135 M-30 555 L1030 520" fill="none" stroke="#b8a677" strokeWidth="13" opacity=".75" />
        <path d="M70 -80 L415 700 M670 -80 L910 700 M-30 210 L1030 135 M-30 555 L1030 520" fill="none" stroke="#f3d9a5" strokeWidth="1" strokeDasharray="10 12" opacity=".75" />
        <path d="M90 42 Q190 75 290 44 L310 165 Q255 210 140 177Z M760 28 Q870 12 960 46 L1000 180 Q887 203 811 141Z M406 490 Q528 454 595 510 L572 602 Q476 643 381 577Z" fill="#668b55" opacity=".63" />
        <circle cx="530" cy="240" r="300" fill="url(#cityGlow)" />
        <path d="M480 258 L520 246 L535 266 L500 282Z M485 220 L499 218 L499 258 L485 263Z M502 204 L515 198 L515 258 L502 260Z M519 226 L533 225 L533 262 L519 264Z" fill="#d5e1c0" opacity=".83" />
        <circle cx="502" cy="270" r="65" fill="none" stroke="#b7d8ab" opacity=".38" strokeWidth="2" />
      </svg>

      <div className="city-map__topline">
        <span className="map-kicker"><span className="map-kicker__dot" /> ЖИВАЯ МОДЕЛЬ / УСЛОВНАЯ СХЕМА</span>
        <span>Выберите район на карте</span>
      </div>

      {districts.map((district) => {
        const outcome = results?.find((item) => item.name === district.name);
        return (
          <button key={district.name} type="button"
            className={`city-map__marker${district.name === activeDistrict ? ' city-map__marker--active' : ''}`}
            style={positions[district.name]}
            aria-pressed={district.name === activeDistrict}
            onClick={() => onSelect(district.name)}>
            <strong>{district.name.toUpperCase()}</strong>
            <span>QoL {((outcome?.score) ?? district.baselineDistrictScore).toFixed(2)}</span>
            {outcome && <small className={outcome.delta >= 0 ? 'is-positive' : 'is-negative'}>
              {outcome.delta >= 0 ? '+' : ''}{outcome.delta.toFixed(2)}
            </small>}
          </button>
        );
      })}

      <div className="city-map__bottomline">
        <div className="city-map__selection">
          <span>В ФОКУСЕ</span>
          <strong>{active?.name ?? 'Все районы'}</strong>
          <small>{active ? `Балл района: ${(activeResult?.score ?? active.baselineDistrictScore).toFixed(2)}` : 'Пять условных районов города'}</small>
        </div>
        <span className="city-map__legend"><i /> Районные меры выбираются для активного района</span>
      </div>
    </section>
  );
};
