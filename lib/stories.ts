import rawStories from '@/content/stories.json';
import type { EventRecord, ContentBlock } from './events';

export type StoryRecord = Omit<EventRecord, 'storyId'> & { story: string; content?: ContentBlock[]; layout?: 'editorial'; author?: string };

export function getPublishedStories(): StoryRecord[] {
  return (rawStories as StoryRecord[]).filter(story => story.status === 'published');
}

export function getStoryById(id: string) {
  return getPublishedStories().find(story => story.id === id);
}
