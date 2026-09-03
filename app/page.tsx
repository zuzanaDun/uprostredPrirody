import { TimelineStory } from '@/components/timeline-story';
import { getPublishedEvents } from '@/lib/events';

export default function Home() {
  return <TimelineStory events={getPublishedEvents()} />;
}
