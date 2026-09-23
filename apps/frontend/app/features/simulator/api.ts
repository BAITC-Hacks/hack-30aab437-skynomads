export interface Decision {
  measureId: string;
  district: string | null;
}

export interface Catalog {
  event: CityEvent | null;
  reservedBudget: number;
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
  event: CityEvent | null;
  budget: number;
  reservedBudget: number;
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
    indicators: Record<string, number>;
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

export interface CityEvent {
  id: string;
  title: string;
  description: string;
  reserve: number;
  shocks: { district: string | null; effects: Record<string, number> }[];
}

export interface TeamResult {
  id: string;
  teamName: string;
  createdAt: string;
  eventId: string | null;
  decisions: Decision[];
  result: Scenario;
}

export interface Recommendation {
  original: Scenario;
  candidate: { decisions: Decision[]; result: Scenario; changedIndex: number } | null;
  explanation: string | null;
  analysisError: string | null;
}

const post = <T>(url: string, body: unknown) => request<T>(url, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

export const loadCatalog = (eventId?: string | null): Promise<Catalog> =>
  request<Catalog>(`/api/simulator${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''}`);

export const submitScenario = (decisions: Decision[], eventId?: string | null): Promise<Scenario> =>
  post<Scenario>('/api/simulator', { decisions, eventId });
export const loadEvents = () => request<CityEvent[]>('/api/simulator/events');
export const drawEvent = () => post<CityEvent>('/api/simulator/events/draw', {});
export const loadTeams = () => request<TeamResult[]>('/api/simulator/teams');
export const saveTeam = (teamName: string, decisions: Decision[], eventId?: string | null) =>
  post<TeamResult>('/api/simulator/teams', { teamName, decisions, eventId });
export const requestRecommendation = (decisions: Decision[], eventId?: string | null) =>
  post<Recommendation>('/api/simulator/recommendation', { decisions, eventId });

export const downloadPresentation = async (teamName: string, decisions: Decision[], eventId?: string | null) => {
  const response = await fetch('/api/simulator/presentation', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamName, decisions, eventId }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Не удалось сформировать презентацию.');
  }
  const blob = await response.blob();
  if (!response.headers.get('Content-Type')?.includes('presentationml')) throw new Error('Сервер вернул неверный формат презентации.');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'akim-team-presentation.pptx';
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return response.headers.get('X-AI-Status') === 'ok';
};
