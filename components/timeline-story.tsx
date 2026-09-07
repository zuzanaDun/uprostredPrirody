'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleStop,
  Compass,
  Copy,
  Hammer,
  Leaf,
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
  { name: 'Slameno-hlinený dom', icon: Hammer },
  { name: 'Slamenno-hlinená chatka', icon: BookOpen },
  { name: 'Záhrada', icon: Sprout },
  { name: 'Plot', icon: RefreshCw },
  { name: 'Zvieratá', icon: PawPrint },
  { name: 'Rodina a život', icon: Users },
  { name: 'Jazierko', icon: Sun },
  { name: 'Iné stavby', icon: Compass },
  { name: 'Rodový statok', icon: Leaf },
  { name: 'Miľníky', icon: Star },
  { name: 'Pribehy', icon: BookOpen },
];

const monthNames = ['január', 'február', 'marec', 'apríl', 'máj', 'jún', 'júl', 'august', 'september', 'október', 'november', 'december'];

function formatDate(event: EventRecord, long = false) {
  const date = new Date(`${event.date}T12:00:00`);
  if (event.datePrecision === 'year') return String(date.getFullYear());
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

function RotatingEventMedia({ event }: { event: EventRecord }) {
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
    if (items.length < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setActiveIndex((value) => (value + 1) % items.length), 4800);
    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  if (!items.length) return <PlaceholderMedia alt={`Titulná fotografia udalosti ${event.title}`} />;

  return (
    <div
      className="rotating-media"
      role="img"
      aria-label={`${items[activeIndex].alt}. Fotografia ${activeIndex + 1} z ${items.length}.`}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}
    >
      {items.map((item, index) => (
        <span key={item.src} className={`rotating-slide ${index === activeIndex ? 'is-active' : ''}`} aria-hidden="true">
          <img className="rotating-backdrop" src={item.src} alt="" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />
          <img className="rotating-image" src={item.src} alt="" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />
        </span>
      ))}
      {items.length > 1 && <div className="rotating-dots" aria-label="Výber fotografie">{items.map((item, index) => <button key={item.src} type="button" className={index === activeIndex ? 'active' : ''} onClick={() => setActiveIndex(index)} aria-label={`Zobraziť fotografiu ${index + 1} z ${items.length}`} aria-pressed={index === activeIndex} />)}</div>}
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

function EventCard({ event, index, onOpen }: { event: EventRecord; index: number; onOpen: (event: EventRecord) => void }) {
  const date = new Date(`${event.date}T12:00:00`);
  const isLong = event.story.length > 190 || Boolean(event.content?.length || event.gallery.length || event.video);
  return (
    <article id={`udalost-${event.id}`} className={`timeline-event ${index % 2 ? 'event-right' : 'event-left'} ${event.featured ? 'featured-event' : ''}`}>
      <div className="timeline-node" aria-hidden="true"><span /></div>
      <div className={`event-date ${event.datePrecision === 'year' ? 'year-date' : ''}`}>{event.datePrecision === 'year' ? <strong>{date.getFullYear()}</strong> : <><strong>{date.getDate()}</strong><span>{monthNames[date.getMonth()].slice(0, 3).toUpperCase()}<br />{date.getFullYear()}</span></>}</div>
      <div className="event-visual">
        {event.featured && <span className="milestone-badge"><Star fill="currentColor" /> Míľnik</span>}
        <RotatingEventMedia event={event} />
      </div>
      <div className="event-copy">
        <div className="event-categories">{event.categories.map((category) => <span key={category}>{category}</span>)}</div>
        <h3>{event.title}</h3>
        <p className="event-summary">{event.summary}{isLong && <> <button className="read-story" onClick={() => onOpen(event)}>Čítaj ďalej...</button></>}</p>
        {!isLong && <p className="short-story">{event.story}</p>}
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
  const filtered = useMemo(() => events.map((event, stableIndex) => ({ event, stableIndex })).filter(({ event }) => year === 'all' || event.date.startsWith(year)).filter(({ event }) => month === 'all' || (event.datePrecision !== 'year' && String(new Date(`${event.date}T12:00:00`).getMonth() + 1) === month)).filter(({ event }) => category === 'all' || event.categories.includes(category)).sort((a, b) => { const result = a.event.date.localeCompare(b.event.date) || a.stableIndex - b.stableIndex; return order === 'asc' ? result : -result; }).map(({ event }) => event), [events, year, month, category, order]);
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
        <a className="brand" href="#zaciatok" aria-label="Uprostred prírody – domov"><span className="brand-mark"><Leaf aria-hidden="true" /></span><span className="brand-copy"><small>Rodový statok</small><span>Uprostred prírody</span></span></a>
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
        <div className="section-heading"><div><p className="eyebrow dark"><span /> Cesta časom</p><h2 id="story-title">Ako náš <strong>ROD</strong>ový statok<br />postupne <em>rastie</em></h2></div><p>Každý bod na ceste je jedna spomienka. Vyberte si obdobie alebo nechajte príbeh plynúť.</p></div>

        <div className="timeline-tools">
          <div className="filter-toolbar" aria-label="Filtrovanie príbehu">
            <div className="filter-select"><Select value={year} onValueChange={(value) => setYear(String(value))}><SelectTrigger aria-label="Vybrať rok"><SelectValue>{year === 'all' ? 'Všetky roky' : year}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">Všetky roky</SelectItem>{years.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div className="filter-select"><Select value={month} onValueChange={(value) => setMonth(String(value))}><SelectTrigger aria-label="Vybrať mesiac"><SelectValue>{month === 'all' ? 'Všetky mesiace' : monthNames[Number(month) - 1]}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">Všetky mesiace</SelectItem>{monthNames.map((name, index) => <SelectItem key={name} value={String(index + 1)}>{name[0].toUpperCase() + name.slice(1)}</SelectItem>)}</SelectContent></Select></div>
            <button className="sort-toggle" onClick={() => setOrder((value) => value === 'asc' ? 'desc' : 'asc')} aria-label={order === 'asc' ? 'Zoradené od najstarších, prepnúť na najnovšie' : 'Zoradené od najnovších, prepnúť na najstaršie'} title={order === 'asc' ? 'Od najstarších' : 'Od najnovších'}>{order === 'asc' ? <ArrowDown /> : <ArrowUp />}</button>
            <div className="category-filter" aria-label="Filtrovať podľa kategórie">
              <button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}><Leaf /> Všetko</button>
              {categories.map(({ name, icon: Icon }) => <button key={name} className={category === name ? 'active' : ''} onClick={() => setCategory(name)}><Icon /> {name}</button>)}
            </div>
            <button onClick={clearFilters} disabled={!hasFilters} className="clear-filters" aria-label="Zrušiť filtre" title="Zrušiť filtre"><RotateCcw /></button>
          </div>
        </div>

        <div className="results-summary" aria-live="polite"><span>{filtered.length}</span> {filtered.length === 1 ? 'udalosť' : filtered.length > 1 && filtered.length < 5 ? 'udalosti' : 'udalostí'} v príbehu</div>
        {filtered.length ? <div className="timeline-list">{filtered.map((event, index) => <EventCard key={event.id} event={event} index={index} onOpen={openEvent} />)}</div> : <div className="empty-results"><Leaf /><h3>V tomto období ešte nič nie je</h3><p>Skúste inú kombináciu roka, mesiaca alebo kategórie.</p><Button variant="outline" onClick={clearFilters}><RotateCcw /> Zobraziť celý príbeh</Button></div>}
      </section>

      <section id="o-nas" className="about-section" aria-labelledby="about-title">
        <div className="about-number">02</div>
        <div><p className="eyebrow"><span /> O nás</p><h2 id="about-title">Za každým miestom<br />sú <em>ľudia.</em></h2></div>
        <div className="about-copy">
          <p className="about-opening">Kde bolo, tam bolo, uprostred prenádhernej prírody žil raz jeden malý chlapec v malom domčeku…</p>
          <p>Takto začínajú všetky rozprávky na dobrú noc od času, keď sme si kúpili 1,5 ha pozemok, aby sme vytvorili RODOVÝ STATOK. Naša cesta sa začala, keď sa nám narodil synček a začali sme riešiť zdravú stravu. To ma najprv priviedlo k Zuzke z Liferesetu, kde som sa dozvedela o permakultúre, následne k Jaroslavovi Slobodovi a po prečítaní jeho webu ku knihám Anastasia od Vladimíra Megreho. Práve Anastázia pre nás vytvorila krásny obraz rodových statkov – pozemku nie menšieho než 1 ha, kde rodina vytvorí svoj kúsok raja.</p>
          <p>Tri roky po tom, čo sme zatúžili mať rodový statok, sme sa presťahovali na náš pozemok, kde si tvoríme náš rodový statok, rajskú záhradu, náš priestor lásky.</p>
          <p>Volám sa Zuzka a na rodovom statku žijem so svojím manželom, synom a dcérkou.</p>
          <p>Tento blog je o mojom rodovom statku, o mojej ceste životom. Nech je pre vás inšpiráciou…</p>
        </div>
      </section>

      <footer><a className="brand" href="#zaciatok"><span className="brand-mark"><Leaf /></span><span className="brand-copy"><small>Rodový statok</small><span>Uprostred prírody</span></span></a><p>Príbeh miesta, ktoré tvoríme pre život.</p><a href="#zaciatok">Späť na začiatok ↑</a></footer>

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
