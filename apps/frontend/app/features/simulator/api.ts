export interface Decision {
  measureId: string;
  district: string | null;
}

export interface Catalog {
  budget: number;
  baselineScore: number;
  districts: { name: string; baselineDistrictScore: number; indicators: Record<string, number> }[];
  indicators: { code: string; name: string; direction: string }[];
  measures: {
    id: string;
    direction: string;
    name: string;
    scope: 'Район' | 'Город';
    cost: number;
    lagQuarters: number;
  }[];
}

export interface Scenario {
  cost: number;
  remaining: number;
  score: number;
  baselineScore: number;
  criticalPairs: number;
  districts: {
    name: string;
    score: number;
    delta: number;
    changes: Record<string, number>;
  }[];
  synergies: string[];
  analysis: string | null;
  analysisError: string | null;
}

const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, options);
  const data: unknown = await response.json();
  if (!response.ok) {
    const message = typeof data === 'object' && data !== null && 'error' in data
      && typeof data.error === 'string' ? data.error : 'Не удалось получить данные сервера.';
    throw new Error(message);
  }
  return data as T;
};

export const loadCatalog = (): Promise<Catalog> => request<Catalog>('/api/simulator');

export const submitScenario = (decisions: Decision[]): Promise<Scenario> =>
  request<Scenario>('/api/simulator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decisions }),
  });
