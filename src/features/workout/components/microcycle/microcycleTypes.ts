export interface DayStrainDetail {
  day: string;
  full: string;
  title: string | null;
  volume: number;
  sets: number;
}

const DAYS: Array<[string, string]> = [
  ['Mon', 'Monday'],
  ['Tue', 'Tuesday'],
  ['Wed', 'Wednesday'],
  ['Thu', 'Thursday'],
  ['Fri', 'Friday'],
  ['Sat', 'Saturday'],
  ['Sun', 'Sunday'],
];

export const EMPTY_MICROCYCLE_DAYS: DayStrainDetail[] = DAYS.map(([day, full]) => ({
  day,
  full,
  title: null,
  volume: 0,
  sets: 0,
}));

export const getLocalSystemDayIdx = (): number => {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
};
