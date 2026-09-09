import { FamilyAlbum } from '@/components/family-album';
import { getPublishedEvents } from '@/lib/events';

export default function Home() {
  return <FamilyAlbum events={getPublishedEvents()} initialNow={new Date().toISOString()} />;
}
