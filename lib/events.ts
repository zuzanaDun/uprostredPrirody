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
  categories: string[];
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

type RawEvent = Partial<EventRecord> & { category?: string };

function isValidEvent(value: RawEvent): value is RawEvent & Omit<EventRecord, 'categories'> {
  const hasCategories = Array.isArray(value.categories)
    ? value.categories.some((category) => typeof category === 'string' && category.trim())
    : typeof value.category === 'string' && Boolean(value.category.trim());
  return Boolean(value && typeof value.id === 'string' && value.id.trim() && typeof value.date === 'string' && !Number.isNaN(Date.parse(value.date)) && typeof value.title === 'string' && value.title.trim() && hasCategories && typeof value.summary === 'string' && typeof value.story === 'string' && (value.status === 'published' || value.status === 'draft'));
}

export function getPublishedEvents(): EventRecord[] {
  return (rawEvents as RawEvent[])
    .filter(isValidEvent)
    .filter((event) => event.status === 'published')
    .map((event) => ({ ...event, categories: Array.isArray(event.categories) ? event.categories.filter((category): category is string => typeof category === 'string' && Boolean(category.trim())) : [event.category!], approximateDate: Boolean(event.approximateDate), featured: Boolean(event.featured), location: event.location || '', coverImage: event.coverImage || '', gallery: Array.isArray(event.gallery) ? event.gallery : [], video: event.video || null, content: Array.isArray(event.content) ? event.content : [] }));
}

export function getEventById(id: string) {
  return getPublishedEvents().find((event) => event.id === id);
}
