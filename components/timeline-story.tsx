'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, Leaf, Play, Sparkles, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { EventRecord, GalleryItem } from '@/lib/events';

export function formatDate(event: EventRecord, long = false) {
  const date = new Date(`${event.date}T12:00:00`);
  if (event.datePrecision === 'year') return String(date.getFullYear());
  if (event.datePrecision === 'month') return new Intl.DateTimeFormat('sk-SK', { month: 'long', year: 'numeric' }).format(date);
  const value = new Intl.DateTimeFormat('sk-SK', long ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  return event.approximateDate ? `približne ${value}` : value;
}

function InlineMarkup({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
    return <span key={index}>{part}</span>;
  })}</>;
}

function PlaceholderMedia({ src, alt, label = 'Miesto pre vašu fotografiu', className = '' }: { src?: string; alt: string; label?: string; className?: string }) {
  if (src) {
    return <div className={`media-frame ${className}`}><img src={src} alt={alt} loading="lazy" decoding="async" /></div>;
  }
  return <div className={`placeholder-media ${className}`} role="img" aria-label={alt}><Leaf aria-hidden="true" /><span>{label}</span></div>;
}

export function RotatingEventMedia({ event, active = true }: { event: EventRecord; active?: boolean }) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const items = useMemo(() => {
    const available = event.gallery.filter((item) => Boolean(item.src));
    const cover = available.find((item) => item.src === event.coverImage)
      || (event.coverImage ? { src: event.coverImage, alt: `Titulná fotografia udalosti ${event.title}` } : null);
    return [cover, ...available.filter((item) => item.src !== cover?.src)].filter((item): item is GalleryItem => Boolean(item));
  }, [event.coverImage, event.gallery, event.title]);

  useEffect(() => setActiveIndex(0), [event.id]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .1 });
    if (mediaRef.current) observer.observe(mediaRef.current);
    return () => { observer.disconnect(); media.removeEventListener('change', update); };
  }, []);

  useEffect(() => { if (!active) setActiveIndex(0); }, [active]);

  useEffect(() => {
    if (items.length < 2 || paused || !active || !visible || reducedMotion) return;
    const timer = window.setInterval(() => setActiveIndex((value) => (value + 1) % items.length), 4800);
    return () => window.clearInterval(timer);
  }, [items.length, paused, active, visible, reducedMotion]);

  if (!items.length) return <PlaceholderMedia alt={`Titulná fotografia udalosti ${event.title}`} />;

  return (
    <div
      ref={mediaRef}
      className="rotating-media"
      role="group"
      aria-label={`${items[activeIndex].alt}. Fotografia ${activeIndex + 1} z ${items.length}.`}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}
    >
      {items.map((item, index) => (
        <span key={item.src} className={`rotating-slide ${index === activeIndex ? 'is-active' : ''}`} aria-hidden="true">
          <img className="rotating-image" src={item.src} alt="" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />
        </span>
      ))}
      {active && items.length > 1 && <div className="rotating-dots" aria-label="Výber fotografie">{items.map((item, index) => <button key={item.src} type="button" className={index === activeIndex ? 'active' : ''} onClick={() => setActiveIndex(index)} aria-label={`Zobraziť fotografiu ${index + 1} z ${items.length}`} aria-pressed={index === activeIndex} />)}</div>}
    </div>
  );
}

function YouTubeId(url: string) {
  return url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/)?.[1] || '';
}

function VideoBlock({ event }: { event: EventRecord }) {
  const [started, setStarted] = useState(false);
  if (!event.video) return null;
  const youtubeId = event.video.type === 'youtube' ? YouTubeId(event.video.url) : '';

  if (!started) {
    return (
      <div className="video-placeholder">
        <div><Play aria-hidden="true" /><p>{event.video.title}</p></div>
        <Button onClick={() => setStarted(true)} className="video-play"><Play fill="currentColor" /> Prehrať video</Button>
      </div>
    );
  }

  if (!event.video.url || (event.video.type === 'youtube' && !youtubeId)) {
    return <div className="video-empty"><Sparkles /><strong>Miesto pre vaše video</strong><span>Doplňte YouTube odkaz alebo lokálny súbor v events.json.</span></div>;
  }

  if (event.video.type === 'youtube') {
    return <div className="video-embed"><iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`} title={event.video.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>;
  }

  return <video className="local-video" src={event.video.url} poster={event.video.poster || undefined} controls autoPlay />;
}

function Gallery({ items }: { items: GalleryItem[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const touchStart = useRef<number | null>(null);
  const isOpen = index !== null;
  const current = index === null ? null : items[index];

  const move = (direction: number) => setIndex((value) => value === null ? null : (value + direction + items.length) % items.length);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') move(1);
      if (event.key === 'ArrowLeft') move(-1);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, items.length]);

  if (!items.length) return null;

  return (
    <>
      <section className="detail-gallery" aria-labelledby="gallery-title">
        <div className="detail-section-label"><span>{String(items.length).padStart(2, '0')}</span><h3 id="gallery-title">Fotogaléria</h3></div>
        <div className="gallery-grid">
          {items.map((item, itemIndex) => (
            <button key={`${item.alt}-${itemIndex}`} onClick={() => setIndex(itemIndex)} aria-label={`Otvoriť fotografiu ${itemIndex + 1}: ${item.alt}`}>
              <PlaceholderMedia src={item.src} alt={item.alt} label={`Dočasná fotografia ${itemIndex + 1}`} />
              {item.caption && <span>{item.caption}</span>}
            </button>
          ))}
        </div>
      </section>
      <Dialog open={isOpen} onOpenChange={(open) => !open && setIndex(null)}>
        <DialogContent className="lightbox" showCloseButton={false} onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={(event) => { if (touchStart.current === null) return; const delta = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(delta) > 55) move(delta < 0 ? 1 : -1); touchStart.current = null; }}>
          <DialogTitle className="sr-only">Zväčšená fotografia</DialogTitle>
          <DialogDescription className="sr-only">Fotografiu môžete meniť šípkami alebo gestom.</DialogDescription>
          <button className="lightbox-close" onClick={() => setIndex(null)} aria-label="Zatvoriť galériu"><X /></button>
          {current && <PlaceholderMedia src={current.src} alt={current.alt} label={`Dočasná fotografia ${(index || 0) + 1}`} className="lightbox-media" />}
          <div className="lightbox-caption"><span>{(index || 0) + 1} / {items.length}</span><p>{current?.caption || current?.alt}</p></div>
          {items.length > 1 && <><button className="lightbox-prev" onClick={() => move(-1)} aria-label="Predchádzajúca fotografia"><ChevronLeft /></button><button className="lightbox-next" onClick={() => move(1)} aria-label="Nasledujúca fotografia"><ChevronRight /></button></>}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EventStory({ event, standalone = false }: { event: EventRecord; standalone?: boolean }) {
  const copyLink = async () => {
    const url = `${window.location.origin}/pribeh/${event.id}`;
    try { await navigator.clipboard.writeText(url); } catch { window.prompt('Skopírujte odkaz na príbeh:', url); }
  };

  return (
    <article className={standalone ? 'event-story standalone-story' : 'event-story'}>
      <div className="detail-cover">
        <PlaceholderMedia src={event.coverImage} alt={`Titulná fotografia udalosti ${event.title}`} />
        <div className="detail-cover-shade" />
        <div className="detail-cover-copy">
          <div className="detail-meta"><div className="detail-categories">{event.categories.map((category) => <span key={category}>{category}</span>)}</div>{event.featured && <span className="milestone-label"><Star fill="currentColor" /> Míľnik</span>}</div>
          <h1>{event.title}</h1>
          <p>{formatDate(event, true)}{event.location ? ` · ${event.location}` : ''}</p>
        </div>
      </div>
      <div className="detail-body">
        <p className="detail-lead">{event.summary}</p>
        {event.story.split('\n\n').map((paragraph, index) => <p key={index}><InlineMarkup text={paragraph} /></p>)}
        {event.content?.map((block, index) => {
          if (block.type === 'heading') return <h2 key={index}><InlineMarkup text={block.text} /></h2>;
          if (block.type === 'quote') return <blockquote key={index}><InlineMarkup text={block.text} /></blockquote>;
          if (block.type === 'image') return <figure key={index}><PlaceholderMedia src={block.src} alt={block.alt} /><figcaption>{block.caption}</figcaption></figure>;
          return <p key={index}><InlineMarkup text={block.text} /></p>;
        })}
        <Gallery items={event.gallery} />
        {event.video && <section className="detail-video" aria-labelledby="video-title"><div className="detail-section-label"><span>▶</span><h3 id="video-title">Video</h3></div><VideoBlock event={event} /></section>}
        <div className="share-story"><div><strong>Zdieľajte tento príbeh</strong><span>Priamy odkaz otvorí presne túto udalosť.</span></div><Button variant="outline" onClick={copyLink}><Copy /> Kopírovať odkaz</Button></div>
      </div>
    </article>
  );
}
