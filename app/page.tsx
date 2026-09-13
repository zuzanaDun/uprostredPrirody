import { FamilyAlbum } from '@/components/family-album';
import { getPublishedEvents } from '@/lib/events';
import { getPublishedStories } from '@/lib/stories';

export default function Home() {
  return <FamilyAlbum events={getPublishedEvents()} stories={getPublishedStories()} initialNow={new Date().toISOString()} />;
}
