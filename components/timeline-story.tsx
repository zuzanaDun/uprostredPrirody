'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleStop,
  Compass,
  Copy,
  Hammer,
  Leaf,
  MapPin,
  Pause,
  PawPrint,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { EventRecord, GalleryItem } from '@/lib/events';

const categories = [
  { name: 'Začiatky', icon: BookOpen },
  { name: 'Domov a stavby', icon: Hammer },
  { name: 'Záhrada a rastliny', icon: Sprout },
  { name: 'Zvieratá', icon: PawPrint },
  { name: 'Rodina a život', icon: Users },
  { name: 'Príroda počas roka', icon: Sun },
  { name: 'Premeny miesta', icon: RefreshCw },
  { name: 'Myšlienky a rozhodnutia', icon: Compass },
  { name: 'Míľniky', icon: Star },
];

const monthNames = ['január', 'február', 'marec', 'apríl', 'máj', 'jún', 'júl', 'august', 'september', 'október', 'november', 'december'];

function formatDate(event: EventRecord, long = false) {
  const date = new Date(`${event.date}T12:00:00`);
  const value = new Intl.DateTimeFormat('sk-SK', long ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  return event.approximateDate ? `približne ${value}` : value;
}

function PlaceholderMedia({ src, alt, label = 'Miesto pre vašu fotografiu', className = '' }: { src?: string; alt: string; label?: string; className?: string }) {
  if (src) {
    return <div className={`media-frame ${className}`}><img src={src} alt={alt} loading="lazy" decoding="async" /></div>;
  }
  return <div className={`placeholder-media ${className}`} role="img" aria-label={alt}><Leaf aria-hidden="true" /><span>{label}</span></div>;
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
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
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
          <div className="detail-meta"><span>{event.category}</span>{event.featured && <span className="milestone-label"><Star fill="currentColor" /> Míľnik</span>}</div>
          <h1>{event.title}</h1>
          <p>{formatDate(event, true)}{event.location ? ` · ${event.location}` : ''}</p>
        </div>
      </div>
      <div className="detail-body">
        <p className="detail-lead">{event.summary}</p>
        {event.story.split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        {event.content?.map((block, index) => {
          if (block.type === 'heading') return <h2 key={index}>{block.text}</h2>;
          if (block.type === 'quote') return <blockquote key={index}>{block.text}</blockquote>;
          if (block.type === 'image') return <figure key={index}><PlaceholderMedia src={block.src} alt={block.alt} /><figcaption>{block.caption}</figcaption></figure>;
          return <p key={index}>{block.text}</p>;
        })}
        <Gallery items={event.gallery} />
        {event.video && <section className="detail-video" aria-labelledby="video-title"><div className="detail-section-label"><span>▶</span><h3 id="video-title">Video</h3></div><VideoBlock event={event} /></section>}
        <div className="share-story"><div><strong>Zdieľajte tento príbeh</strong><span>Priamy odkaz otvorí presne túto udalosť.</span></div><Button variant="outline" onClick={copyLink}><Copy /> Kopírovať odkaz</Button></div>
      </div>
    </article>
  );
}

function EventCard({ event, index, onOpen }: { event: EventRecord; index: number; onOpen: (event: EventRecord) => void }) {
  const date = new Date(`${event.date}T12:00:00`);
  const isLong = event.story.length > 190 || Boolean(event.content?.length || event.gallery.length || event.video);
  return (
    <article id={`udalost-${event.id}`} className={`timeline-event ${index % 2 ? 'event-right' : 'event-left'} ${event.featured ? 'featured-event' : ''}`}>
      <div className="timeline-node" aria-hidden="true"><span /></div>
      <div className="event-date"><strong>{date.getDate()}</strong><span>{monthNames[date.getMonth()].slice(0, 3).toUpperCase()}<br />{date.getFullYear()}</span></div>
      <div className="event-visual">
        {event.featured && <span className="milestone-badge"><Star fill="currentColor" /> Míľnik</span>}
        <PlaceholderMedia src={event.coverImage} alt={`Titulná fotografia udalosti ${event.title}`} />
      </div>
      <div className="event-copy">
        <p className="event-category">{event.category}</p>
        <h3>{event.title}</h3>
        <p>{event.summary}</p>
        {!isLong && <p className="short-story">{event.story}</p>}
        {event.location && <span className="event-location"><MapPin /> {event.location}</span>}
        {isLong && <Button variant="link" className="read-story" onClick={() => onOpen(event)}>Prečítať celý príbeh <ArrowRight /></Button>}
      </div>
    </article>
  );
}

export function TimelineStory({ events }: { events: EventRecord[] }) {
  const [year, setYear] = useState('all');
  const [month, setMonth] = useState('all');
  const [category, setCategory] = useState('all');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<EventRecord | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const previousUrl = useRef('/#pribeh');

  const years = useMemo(() => [...new Set(events.map((event) => event.date.slice(0, 4)))].sort(), [events]);
  const filtered = useMemo(() => events.map((event, stableIndex) => ({ event, stableIndex })).filter(({ event }) => year === 'all' || event.date.startsWith(year)).filter(({ event }) => month === 'all' || String(new Date(`${event.date}T12:00:00`).getMonth() + 1) === month).filter(({ event }) => category === 'all' || event.category === category).sort((a, b) => { const result = a.event.date.localeCompare(b.event.date) || a.stableIndex - b.stableIndex; return order === 'asc' ? result : -result; }).map(({ event }) => event), [events, year, month, category, order]);
  const activeEvent = filtered[currentIndex];
  const hasFilters = year !== 'all' || month !== 'all' || category !== 'all';

  const scrollToEvent = (event: EventRecord | undefined) => {
    if (!event) return;
    window.setTimeout(() => document.getElementById(`udalost-${event.id}`)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' }), 50);
  };

  const startStory = () => {
    if (!filtered.length) return;
    setCurrentIndex(0); setPlayerOpen(true); setPlaying(true); scrollToEvent(filtered[0]);
  };

  const movePlayer = (direction: number) => {
    const next = Math.min(Math.max(currentIndex + direction, 0), filtered.length - 1);
    setCurrentIndex(next);
    scrollToEvent(filtered[next]);
    if (direction > 0 && filtered[next] && (filtered[next].story.length > 190 || filtered[next].content?.length)) setPlaying(false);
  };

  useEffect(() => {
    if (!playing || !playerOpen || !activeEvent) return;
    const timer = window.setTimeout(() => {
      if (currentIndex >= filtered.length - 1) { setPlaying(false); return; }
      movePlayer(1);
    }, 5200);
    return () => window.clearTimeout(timer);
  }, [playing, playerOpen, currentIndex, filtered.length, activeEvent?.id]);

  useEffect(() => {
    if (currentIndex > filtered.length - 1) setCurrentIndex(0);
  }, [filtered.length, currentIndex]);

  useEffect(() => {
    const onPopState = () => setSelected(null);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const openEvent = (event: EventRecord) => {
    previousUrl.current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.pushState({ event: event.id }, '', `/pribeh/${event.id}`);
    setSelected(event);
  };

  const closeEvent = () => {
    setSelected(null);
    window.history.replaceState({}, '', previousUrl.current);
  };

  const clearFilters = () => { setYear('all'); setMonth('all'); setCategory('all'); };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#zaciatok" aria-label="Uprostred prírody – domov"><span className="brand-mark"><Leaf aria-hidden="true" /></span><span>Uprostred prírody</span></a>
        <nav aria-label="Hlavná navigácia"><a className="nav-active" href="#pribeh">Príbeh statku</a><a href="#o-nas">O nás</a></nav>
      </header>

      <section id="zaciatok" className="hero">
        <div className="hero-orbit orbit-one" aria-hidden="true" /><div className="hero-orbit orbit-two" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow"><span /> Rodový statok · živý príbeh</p>
          <h1>Príbeh miesta,<br />ktoré tvoríme <em>pre život.</em></h1>
          <p className="hero-intro">Rodový statok nevznikne za jeden deň. Rastie spolu s nami – cez rozhodnutia, prácu, radosť, chyby aj chvíle, na ktoré nechceme zabudnúť.</p>
          <div className="hero-actions"><Button size="lg" className="play-button" onClick={startStory} disabled={!filtered.length}><Play fill="currentColor" /> Prehrať náš príbeh</Button><a className="explore-link" href="#pribeh">alebo preskúmať vlastným tempom <ArrowDown /></a></div>
        </div>
        <div className="season-seal" aria-hidden="true"><span>od prvého dňa</span><strong>∞</strong><span>až po dnešok</span></div>
      </section>

      <section id="pribeh" className="story-section" aria-labelledby="story-title">
        <div className="section-heading"><div><p className="eyebrow dark"><span /> Cesta časom</p><h2 id="story-title">Ako miesto<br />postupne <em>rastie</em></h2></div><p>Každý bod na ceste je jedna spomienka. Vyberte si obdobie alebo nechajte príbeh plynúť.</p></div>

        <div className="timeline-tools">
          <div className="year-rail" aria-label="Rýchla navigácia podľa rokov">
            <button className={year === 'all' ? 'active' : ''} onClick={() => setYear('all')}>Všetky roky</button>
            {years.map((item) => <button key={item} className={year === item ? 'active' : ''} onClick={() => setYear(item)}>{item}</button>)}
          </div>
          <div className="filter-row">
            <div className="select-wrap"><label>Mesiac</label><Select value={month} onValueChange={(value) => setMonth(String(value))}><SelectTrigger><SelectValue>{month === 'all' ? 'Všetky mesiace' : monthNames[Number(month) - 1]}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">Všetky mesiace</SelectItem>{monthNames.map((name, index) => <SelectItem key={name} value={String(index + 1)}>{name[0].toUpperCase() + name.slice(1)}</SelectItem>)}</SelectContent></Select></div>
            <div className="select-wrap"><label>Poradie</label><Select value={order} onValueChange={(value) => setOrder(value as 'asc' | 'desc')}><SelectTrigger><SelectValue>{order === 'asc' ? 'Od najstarších' : 'Od najnovších'}</SelectValue></SelectTrigger><SelectContent><SelectItem value="asc">Od najstarších</SelectItem><SelectItem value="desc">Od najnovších</SelectItem></SelectContent></Select></div>
            <Button variant="ghost" onClick={clearFilters} disabled={!hasFilters} className="clear-filters"><RotateCcw /> Zrušiť filtre</Button>
          </div>
          <div className="category-filter" aria-label="Filtrovať podľa kategórie">
            <button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}><Leaf /> Všetko</button>
            {categories.map(({ name, icon: Icon }) => <button key={name} className={category === name ? 'active' : ''} onClick={() => setCategory(name)}><Icon /> {name}</button>)}
          </div>
        </div>

        <div className="results-summary" aria-live="polite"><span>{filtered.length}</span> {filtered.length === 1 ? 'udalosť' : filtered.length > 1 && filtered.length < 5 ? 'udalosti' : 'udalostí'} v príbehu</div>
        {filtered.length ? <div className="timeline-list">{filtered.map((event, index) => <EventCard key={event.id} event={event} index={index} onOpen={openEvent} />)}</div> : <div className="empty-results"><Leaf /><h3>V tomto období ešte nič nie je</h3><p>Skúste inú kombináciu roka, mesiaca alebo kategórie.</p><Button variant="outline" onClick={clearFilters}><RotateCcw /> Zobraziť celý príbeh</Button></div>}
      </section>

      <section id="o-nas" className="about-section" aria-labelledby="about-title">
        <div className="about-number">02</div>
        <div><p className="eyebrow"><span /> O nás</p><h2 id="about-title">Za každým miestom<br />sú <em>ľudia.</em></h2></div>
        <div className="about-copy"><span>Dočasný obsah</span><p>Sme ľudia, ktorí si zvolili tvoriť miesto pre život bližšie k prírode. Tento text je pripravený na vaše vlastné slová – kto ste, čo pre vás rodový statok znamená a prečo chcete jeho premenu odovzdať ďalej.</p><p>Keď budete pripravení, nahraďte tento krátky úvod osobným príbehom v obsahu stránky.</p></div>
      </section>

      <footer><a className="brand" href="#zaciatok"><span className="brand-mark"><Leaf /></span><span>Uprostred prírody</span></a><p>Príbeh miesta, ktoré tvoríme pre život.</p><a href="#zaciatok">Späť na začiatok ↑</a></footer>

      {playerOpen && activeEvent && <aside className="story-player" aria-label="Automatické prehrávanie príbehu">
        <div className="player-top"><div><span>Príbeh sa prehráva</span><strong>{activeEvent.date.slice(0, 4)} · {activeEvent.title}</strong></div><Button variant="ghost" size="icon" onClick={() => { setPlayerOpen(false); setPlaying(false); }} aria-label="Ukončiť prehrávanie"><CircleStop /></Button></div>
        <Progress value={((currentIndex + 1) / filtered.length) * 100}><ProgressLabel>Udalosť {currentIndex + 1}</ProgressLabel><ProgressValue>{currentIndex + 1} / {filtered.length}</ProgressValue></Progress>
        <div className="player-controls"><Button variant="outline" size="icon" onClick={() => movePlayer(-1)} disabled={currentIndex === 0} aria-label="Predchádzajúca udalosť"><ChevronLeft /></Button><Button className="player-main" onClick={() => setPlaying((value) => !value)}>{playing ? <><Pause fill="currentColor" /> Pozastaviť</> : <><Play fill="currentColor" /> Pokračovať</>}</Button><Button variant="outline" size="icon" onClick={() => movePlayer(1)} disabled={currentIndex === filtered.length - 1} aria-label="Nasledujúca udalosť"><ChevronRight /></Button><Button variant="ghost" onClick={() => { setPlayerOpen(false); setPlaying(false); }}>Ukončiť</Button></div>
      </aside>}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && closeEvent()}>
        <SheetContent side="right" className="event-sheet sm:!max-w-[min(860px,92vw)] !w-[min(860px,92vw)] !p-0 !gap-0" showCloseButton={false}>
          <SheetTitle className="sr-only">{selected?.title}</SheetTitle><SheetDescription className="sr-only">Detail udalosti z príbehu statku</SheetDescription>
          <button className="detail-close" onClick={closeEvent} aria-label="Zatvoriť detail príbehu"><ArrowLeft /> Späť na časovú os</button>
          {selected && <EventStory event={selected} />}
        </SheetContent>
      </Sheet>
    </main>
  );
}
