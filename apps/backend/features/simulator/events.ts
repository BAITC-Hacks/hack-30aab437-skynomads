export interface CityEvent {
  id: string;
  title: string;
  description: string;
  reserve: number;
  shocks: { district: string | null; effects: Record<string, number> }[];
}

// Additional synthetic game conditions, not the official challenge dataset.
export const CITY_EVENTS: CityEvent[] = [
  {
    id: 'cold-wave', title: 'Экстремальные морозы', reserve: 20,
    description: 'На аварийное реагирование резервируется 20 единиц. Во всех районах падают надёжность ЖКХ и качество воздуха.',
    shocks: [{ district: null, effects: { C1: -12, E2: -6 } }],
  },
  {
    id: 'flood', title: 'Весеннее подтопление', reserve: 15,
    description: 'На неотложные работы резервируется 15 единиц. Подтопление затрагивает транспорт и сети Есиля и Нуры.',
    shocks: [{ district: 'Есиль', effects: { T1: -10, C1: -8 } }, { district: 'Нура', effects: { T2: -6, C1: -10 } }],
  },
  {
    id: 'smog', title: 'Затяжной смог', reserve: 10,
    description: 'На экстренное реагирование резервируется 10 единиц. Качество воздуха ухудшается в Сарыарке и Байконуре.',
    shocks: [{ district: 'Сарыарка', effects: { E2: -15 } }, { district: 'Байконур', effects: { E2: -8 } }],
  },
];
