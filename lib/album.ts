import type { EventRecord } from './events';

export function estateYears(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bratislava', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const value = (key: string) => Number(parts.find((part) => part.type === key)?.value);
  return Math.max(0, value('year') - 2017 - (value('month') < 8 || (value('month') === 8 && value('day') < 6) ? 1 : 0));
}

export function estateDuration(now: Date) {
  const years = estateYears(now);
  return `${years} ${years === 1 ? 'rok' : years >= 2 && years <= 4 ? 'roky' : 'rokov'}`;
}

export function albumColumns(width: number, zoom: number) {
  const target = (width <= 640 ? [80, 150, 280] : [140, 240, 380])[zoom];
  return Math.max(1, Math.floor((width + 3) / (target + 3)));
}

export function albumPeriod(event: EventRecord) {
  return event.datePrecision === 'year' ? event.date.slice(0, 4) : new Intl.DateTimeFormat('sk-SK', { month: 'long', year: 'numeric' }).format(new Date(`${event.date}T12:00:00`));
}
