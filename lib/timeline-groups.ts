import type { EventRecord } from './events';

export function groupTimelineEvents(events: EventRecord[]) {
  const groups = new Map<string, { key: string; label: string; events: EventRecord[] }>();
  for (const event of events) {
    const key = event.date.slice(0, event.datePrecision === 'year' ? 4 : 7);
    if (!groups.has(key)) {
      const label = event.datePrecision === 'year' ? key : new Intl.DateTimeFormat('sk-SK', { month: 'long', year: 'numeric' }).format(new Date(`${event.date}T12:00:00`));
      groups.set(key, { key, label, events: [] });
    }
    groups.get(key)!.events.push(event);
  }
  return [...groups.values()];
}
