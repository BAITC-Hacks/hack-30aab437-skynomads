import type { Catalog, Decision } from './api';

export interface MapInitiative {
  key: string;
  measure: Catalog['measures'][number];
  district: string;
  order: number;
}

export const initiativeColors: Record<string, string> = {
  Транспорт: '#559bff', Экология: '#72e394', Соцсфера: '#ffc374',
  Безопасность: '#fc8792', Сервисы: '#b99aff',
};

/* Visual placements only: validation and Score remain on the server. */
export const getMapInitiatives = (
  decisions: Decision[], measures: Catalog['measures'], districts: Catalog['districts'],
): MapInitiative[] => {
  const seen = new Set<string>();
  return decisions.flatMap((decision) => {
    const order = measures.findIndex((measure) => measure.id === decision.measureId);
    const measure = measures[order];
    if (!measure || seen.has(measure.id)) return [];
    seen.add(measure.id);
    const targets = measure.scope === 'Город'
      ? districts : districts.filter((district) => district.name === decision.district);
    return targets.map(({ name }) => ({ key: `${measure.id}:${name}`, measure, district: name, order }));
  });
};
