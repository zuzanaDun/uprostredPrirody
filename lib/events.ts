import rawEvents from '@/content/events.json';

export type GalleryItem = { src: string; alt: string; caption?: string };
export type VideoItem = { type: 'youtube' | 'local'; url: string; title: string; poster?: string };
export type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'image'; src: string; alt: string; caption?: string };

export type EventRecord = {
  id: string;
  date: string;
  approximateDate: boolean;
  title: string;
  category: string;
  summary: string;
  story: string;
  featured: boolean;
  location: string;
  coverImage: string;
  gallery: GalleryItem[];
  video: VideoItem | null;
  status: 'draft' | 'published';
  content?: ContentBlock[];
};

function isValidEvent(value: Partial<EventRecord>): value is EventRecord {
  return Boolean(value && typeof value.id === 'string' && value.id.trim() && typeof value.date === 'string' && !Number.isNaN(Date.parse(value.date)) && typeof value.title === 'string' && value.title.trim() && typeof value.category === 'string' && typeof value.summary === 'string' && typeof value.story === 'string' && (value.status === 'published' || value.status === 'draft'));
}

export function getPublishedEvents(): EventRecord[] {
  return (rawEvents as Partial<EventRecord>[])
    .filter(isValidEvent)
    .filter((event) => event.status === 'published')
    .map((event) => ({ ...event, approximateDate: Boolean(event.approximateDate), featured: Boolean(event.featured), location: event.location || '', coverImage: event.coverImage || '', gallery: Array.isArray(event.gallery) ? event.gallery : [], video: event.video || null, content: Array.isArray(event.content) ? event.content : [] }));
}

export function getEventById(id: string) {
  return getPublishedEvents().find((event) => event.id === id);
}
