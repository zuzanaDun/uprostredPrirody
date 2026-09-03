import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, Leaf } from 'lucide-react';
import { EventStory } from '@/components/timeline-story';
import { getEventById, getPublishedEvents } from '@/lib/events';

export function generateStaticParams() {
  return getPublishedEvents().map((event) => ({ slug: event.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = getEventById(slug);
  if (!event) return {};
  return {
    title: `${event.title} – Uprostred prírody`,
    description: event.summary,
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEventById(slug);
  if (!event) notFound();

  return (
    <main className="direct-story-page">
      <header className="direct-header">
        <a className="brand" href="/" aria-label="Uprostred prírody – domov"><span className="brand-mark"><Leaf /></span><span>Uprostred prírody</span></a>
        <a className="back-link" href="/#pribeh"><ArrowLeft /> Späť na časovú os</a>
      </header>
      <EventStory event={event} standalone />
    </main>
  );
}
