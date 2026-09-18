import type { StoryRecord } from './stories';

export function filterStories(stories: StoryRecord[], year: string, month: string, category: string) {
  return stories.filter(story =>
    (year === 'all' || story.date.startsWith(year)) &&
    (month === 'all' || (story.datePrecision !== 'year' && Number(story.date.slice(5, 7)) === Number(month))) &&
    (category === 'all' || story.categories.includes(category)));
}
