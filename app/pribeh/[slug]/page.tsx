import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, Leaf } from 'lucide-react';
import { EventStory } from '@/components/timeline-story';
import { getEventById, getPublishedEvents } from '@/lib/events';
import { getStoryById, getPublishedStories } from '@/lib/stories';
import { FamilyAlbum } from '@/components/family-album';

export function generateStaticParams() {
  return [...new Set([...getPublishedEvents(), ...getPublishedStories()].map(item => item.id))].map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = getStoryById(slug) || getEventById(slug);
  if (!event) return {};
  return {
    title: `${event.title} – Uprostred prírody`,
    description: event.summary,
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getStoryById(slug);
  if (!event) {
    if (!getEventById(slug)) notFound();
    return <FamilyAlbum events={getPublishedEvents()} stories={getPublishedStories()} initialNow={new Date().toISOString()} initialEventId={slug} />;
  }

  return (
    <main className="direct-story-page">
      <header className="direct-header">
        <a className="brand" href="/" aria-label="Uprostred prírody – domov"><span className="brand-mark"><Leaf /></span><span className="brand-copy"><small>Rodový statok</small><span>Uprostred prírody</span></span></a>
        <a className="back-link" href="/#pribehy"><ArrowLeft /> Späť na príbehy</a>
      </header>
      <EventStory event={event} standalone />
    </main>
  );
}
