'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Star, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatDate } from './timeline-story';
import type { EventRecord } from '@/lib/events';

export function EventCardDialog({ event, onClose, returnFocus }: { event: EventRecord | null; onClose: () => void; returnFocus: React.RefObject<HTMLElement | null> }) {
  return <Dialog open={Boolean(event)} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="event-card-modal" showCloseButton={false} finalFocus={returnFocus}>
      {event && <ExpandedEvent key={event.id} event={event} onClose={onClose} />}
    </DialogContent>
  </Dialog>;
}

function ExpandedEvent({ event, onClose }: { event: EventRecord; onClose: () => void }) {
  const photos = event.gallery.length ? event.gallery : event.coverImage ? [{ src: event.coverImage, alt: event.title }] : [];
  const [index, setIndex] = useState(Math.max(0, photos.findIndex(photo => photo.src === event.coverImage)));
  const touch = useRef<{ x: number; y: number } | null>(null);
  const move = (direction: number) => setIndex(current => (current + direction + photos.length) % photos.length);
  return <article onKeyDown={e => { if (photos.length > 1 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); move(e.key === 'ArrowRight' ? 1 : -1); } }}>
    <button className="event-card-close" onClick={onClose} aria-label="Zatvoriť udalosť"><X /></button>
    <div className="event-card-photo" onTouchStart={e => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }} onTouchEnd={e => { if (!touch.current || photos.length < 2) return; const dx = e.changedTouches[0].clientX - touch.current.x; const dy = e.changedTouches[0].clientY - touch.current.y; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1); touch.current = null; }}>
      {photos[index] && <img src={photos[index].src} alt={photos[index].alt} />}
      {photos.length > 1 && <><button className="event-photo-prev" onClick={() => move(-1)} aria-label="Predchádzajúca fotografia"><ChevronLeft /></button><button className="event-photo-next" onClick={() => move(1)} aria-label="Nasledujúca fotografia"><ChevronRight /></button><span className="event-photo-count" aria-live="polite">{index + 1} / {photos.length}</span></>}
    </div>
    <div className="event-card-body">
      <div className="event-card-meta">{formatDate(event)}{event.featured && <span><Star size={14} fill="currentColor" /> Míľnik</span>}</div>
      <DialogTitle className="event-card-title">{event.title}</DialogTitle>
      <div className="event-card-categories">{event.categories.join(' · ')}</div>
      <DialogDescription className="event-card-summary">{event.summary}</DialogDescription>
      {event.storyId && <a className="event-story-link" href={`/pribeh/${event.storyId}`}>Čítať príbeh →</a>}
      {event.video && <a className="event-story-link" href={event.video.url}>Prehrať video →</a>}
    </div>
  </article>;
}
