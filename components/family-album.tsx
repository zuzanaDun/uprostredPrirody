'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Leaf, Minus, Pause, Play, Plus, RotateCcw, SlidersHorizontal, Star, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Field as SliderField } from '@base-ui/react/field';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { EventStory, formatDate, RotatingEventMedia } from '@/components/timeline-story';
import { albumColumns, albumPeriod, estateDuration } from '@/lib/album';
import { AboutSlideshow } from '@/components/about-slideshow';
import type { EventRecord } from '@/lib/events';

const categoryNames = ['Slameno-hlinený dom', 'Slameno-hlinená chatka', 'Záhrada', 'Plot', 'Zvieratá', 'Rodina a život', 'Jazierko', 'Iné stavby', 'Rodový statok', 'Miľníky', 'Pribehy'];
const months = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'];
const sizes = ['Malé', 'Stredné', 'Veľké'];
type Anchor = { id: string; offset: number; bottom: boolean };

function AlbumTile({ event, zoom, active, onOpen }: { event: EventRecord; zoom: number; active: boolean; onOpen: (event: EventRecord) => void }) {
  return (
    <article id={`udalost-${event.id}`} data-event-id={event.id} className="album-tile">
      <RotatingEventMedia event={event} active={active && zoom > 0} />
      <button className="album-tile-open" onClick={() => onOpen(event)} aria-label={`Otvoriť príbeh: ${event.title}, ${formatDate(event)}`} />
      {zoom > 0 && <div className="album-tile-copy">
        <div className="album-tile-meta">{event.featured && <span className="album-milestone"><Star fill="currentColor" aria-hidden="true" /> Míľnik</span>}<time dateTime={event.datePrecision === 'year' ? event.date.slice(0, 4) : event.datePrecision === 'month' ? event.date.slice(0, 7) : event.date}>{formatDate(event)}</time></div>
        <h2>{event.title}</h2>
        {zoom === 2 && <><div className="album-tile-categories">{event.categories.join(' · ')}</div><p>{event.summary}</p></>}
      </div>}
    </article>
  );
}

export function FamilyAlbum({ events, initialNow }: { events: EventRecord[]; initialNow: string }) {
  const [tab, setTab] = useState('events');
  const [duration, setDuration] = useState(() => estateDuration(new Date(initialNow)));
  const [year, setYear] = useState('all');
  const [month, setMonth] = useState('all');
  const [category, setCategory] = useState('all');
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [period, setPeriod] = useState('');
  const [selected, setSelected] = useState<EventRecord | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playerIndex, setPlayerIndex] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<Anchor | null>(null);
  const lastFilter = useRef('');
  const frame = useRef(0);
  const previousUrl = useRef('/');
  const years = useMemo(() => [...new Set(events.map(event => event.date.slice(0, 4)))].sort(), [events]);
  const filtered = useMemo(() => events
    .filter(event => year === 'all' || event.date.startsWith(year))
    .filter(event => month === 'all' || (event.datePrecision !== 'year' && Number(event.date.slice(5, 7)) === Number(month)))
    .filter(event => category === 'all' || event.categories.includes(category))
    .sort((a, b) => a.date.localeCompare(b.date)), [events, year, month, category]);
  const columns = albumColumns(width, zoom);
  const filterKey = `${year}|${month}|${category}`;
  const hasFilters = year !== 'all' || month !== 'all' || category !== 'all';
  const activeEvent = filtered[playerIndex];

  useEffect(() => {
    const refresh = () => setDuration(estateDuration(new Date()));
    refresh();
    const timer = window.setInterval(refresh, 1000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, []);

  const capturePosition = useCallback(() => {
    const viewport = viewportRef.current;
    const tiles = Array.from(gridRef.current?.children || []) as HTMLElement[];
    if (!viewport || !tiles.length || tab !== 'events' || !viewport.clientHeight) return;
    const first = tiles.find(tile => tile.offsetTop + tile.offsetHeight > viewport.scrollTop + 1) || tiles[tiles.length - 1];
    const row = tiles.filter(tile => tile.offsetTop === first.offsetTop);
    const firstEvent = filtered.find(event => event.id === first.dataset.eventId);
    const lastEvent = filtered.find(event => event.id === row[row.length - 1]?.dataset.eventId);
    if (firstEvent && lastEvent) {
      const start = albumPeriod(firstEvent), end = albumPeriod(lastEvent);
      setPeriod(start === end ? start : `${start} – ${end}`);
    }
    anchorRef.current = { id: first.dataset.eventId!, offset: first.offsetTop - viewport.scrollTop, bottom: viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop < 3 };
  }, [filtered, tab]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || tab !== 'events') return;
    const measure = () => { setWidth(viewport.clientWidth); setHeight(viewport.clientHeight); };
    const observer = new ResizeObserver(measure);
    measure();
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [tab]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || tab !== 'events' || !width) return;
    const anchor = anchorRef.current;
    if (lastFilter.current !== filterKey || !anchor || anchor.bottom) {
      viewport.scrollTop = viewport.scrollHeight;
    } else {
      const tile = Array.from(gridRef.current?.children || []).find(item => (item as HTMLElement).dataset.eventId === anchor.id) as HTMLElement | undefined;
      if (tile) viewport.scrollTop = tile.offsetTop - anchor.offset;
    }
    lastFilter.current = filterKey;
    if (!filtered.length) { setPeriod('Žiadne udalosti'); anchorRef.current = null; }
    else capturePosition();
  }, [width, height, zoom, tab, filterKey, filtered, capturePosition]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(capturePosition);
  };
  const changeZoom = (value: number) => {
    capturePosition();
    setZoom(Math.max(0, Math.min(2, value)));
  };
  const clearFilters = () => { setYear('all'); setMonth('all'); setCategory('all'); };
  useEffect(() => { setPlaying(false); setPlayerOpen(false); setPlayerIndex(0); }, [filterKey]);

  const scrollToEvent = useCallback((event: EventRecord | undefined) => {
    if (!event || !viewportRef.current) return;
    const tile = document.getElementById(`udalost-${event.id}`);
    if (tile) viewportRef.current.scrollTo({ top: tile.offsetTop - (viewportRef.current.clientHeight - tile.offsetHeight) / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, []);
  const movePlayer = (direction: number) => {
    const next = Math.max(0, Math.min(filtered.length - 1, playerIndex + direction));
    setPlayerIndex(next); scrollToEvent(filtered[next]);
  };
  useEffect(() => {
    if (!playing || !playerOpen || tab !== 'events' || selected) return;
    const timer = window.setTimeout(() => {
      if (playerIndex >= filtered.length - 1) { setPlaying(false); return; }
      setPlayerIndex(playerIndex + 1); scrollToEvent(filtered[playerIndex + 1]);
    }, 5200);
    return () => window.clearTimeout(timer);
  }, [playing, playerOpen, tab, selected, playerIndex, filtered, scrollToEvent]);

  const openEvent = (event: EventRecord) => {
    capturePosition(); setPlaying(false);
    previousUrl.current = `${location.pathname}${location.search}${location.hash}`;
    history.pushState({ albumEvent: event.id }, '', `/pribeh/${event.id}`);
    setSelected(event);
  };
  const closeEvent = () => {
    setSelected(null);
    history.replaceState({}, '', previousUrl.current);
  };
  useEffect(() => {
    const onPop = () => setSelected(events.find(event => location.pathname === `/pribeh/${event.id}`) || null);
    const initialTab = location.hash === '#o-nas' ? 'about' : 'events';
    setTab(initialTab);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [events]);

  return (
    <main className="family-album">
      <Tabs value={tab} onValueChange={value => { capturePosition(); setTab(String(value)); setPlaying(false); }} className="album-shell">
        <header className="album-header">
          <img className="album-logo" src="/images/logo-uprostred-prirody.png" alt="" width={1202} height={1199} />
          <div className="album-brand">Rodový statok</div>
          <h1>Uprostred <em>prírody</em></h1>
          <p><span className="album-intro-name">Som Zuzka.</span> Spolu s mojou rodinou tvoríme rodový statok už <strong>{duration}</strong>.</p>
          <TabsList variant="line" className="album-tabs" aria-label="Hlavná navigácia"><TabsTrigger value="events">Udalosti</TabsTrigger><TabsTrigger value="about">O nás</TabsTrigger></TabsList>
        </header>
        <TabsContent value="events" keepMounted className="album-events">
          <div className="album-toolbar">
            <div className="album-period" aria-label="Práve zobrazené obdobie">{period || (filtered.length ? albumPeriod(filtered[filtered.length - 1]) : 'Žiadne udalosti')}</div>
            <div className="album-actions">
              <Popover><PopoverTrigger className={`album-control ${hasFilters ? 'is-active' : ''}`} aria-label={hasFilters ? 'Filtre, aktívne filtrovanie' : 'Filtre'}><SlidersHorizontal /><span>Filtre{hasFilters ? ' •' : ''}</span></PopoverTrigger>
                <PopoverContent className="album-filters" align="end">
                  <PopoverTitle>Filtrovať udalosti</PopoverTitle>
                  <Select value={year} onValueChange={v => setYear(String(v))}><SelectTrigger aria-label="Vybrať rok"><SelectValue>{year === 'all' ? 'Všetky roky' : year}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">Všetky roky</SelectItem>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
                  <Select value={month} onValueChange={v => setMonth(String(v))}><SelectTrigger aria-label="Vybrať mesiac"><SelectValue>{month === 'all' ? 'Všetky mesiace' : months[Number(month) - 1]}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">Všetky mesiace</SelectItem>{months.map((name, i) => <SelectItem key={name} value={String(i + 1)}>{name}</SelectItem>)}</SelectContent></Select>
                  <Select value={category} onValueChange={v => setCategory(String(v))}><SelectTrigger aria-label="Vybrať kategóriu"><SelectValue>{category === 'all' ? 'Všetky kategórie' : category}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">Všetky kategórie</SelectItem>{categoryNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select>
                  <span aria-live="polite">{filtered.length} z {events.length} udalostí</span>
                  <button className="album-control" onClick={clearFilters} disabled={!hasFilters}><RotateCcw /> Zrušiť filtre</button>
                </PopoverContent>
              </Popover>
              <button className="album-control album-play" disabled={!filtered.length} aria-label="Prehrať náš príbeh" onClick={() => { setPlayerIndex(0); setPlayerOpen(true); setPlaying(true); scrollToEvent(filtered[0]); }}><Play /></button>
              <div className="album-zoom" role="group" aria-label="Veľkosť dlaždíc">
                <button className="album-control" aria-label="Zmenšiť dlaždice" disabled={zoom === 0} onClick={() => changeZoom(zoom - 1)}><Minus /></button>
                <SliderField.Root className="album-zoom-field"><SliderField.Label className="sr-only">Veľkosť dlaždíc: {sizes[zoom]}</SliderField.Label><Slider value={[zoom]} min={0} max={2} step={1} onValueChange={value => changeZoom(Number(Array.isArray(value) ? value[0] : value))} /></SliderField.Root>
                <button className="album-control" aria-label="Zväčšiť dlaždice" disabled={zoom === 2} onClick={() => changeZoom(zoom + 1)}><Plus /></button>
              </div>
            </div>
          </div>
          <div ref={viewportRef} className="album-viewport" onScroll={onScroll} tabIndex={0} aria-label="Udalosti, staršie nájdete posúvaním nahor">
            {filtered.length ? <div ref={gridRef} className={`album-grid album-size-${zoom}`} style={{ '--album-columns': columns } as CSSProperties}>{filtered.map(event => <AlbumTile key={event.id} event={event} zoom={zoom} active={tab === 'events' && !selected} onOpen={openEvent} />)}</div> : <div className="album-empty"><Leaf /><h2>V tomto období ešte nič nie je</h2><p>Skúste iný rok, mesiac alebo kategóriu.</p><button className="album-control" onClick={clearFilters}><RotateCcw /> Zobraziť všetky udalosti</button></div>}
          </div>
        </TabsContent>
        <TabsContent value="about" keepMounted className="album-about-tab">
          <div className="album-toolbar album-about-toolbar"><h2 id="about-title">Za každým miestom sú <em>ľudia.</em></h2></div>
          <div className="album-about-panel"><AboutUs active={tab === 'about'} /></div>
        </TabsContent>
      </Tabs>
      {playerOpen && activeEvent && tab === 'events' && <aside className="album-player" aria-label="Prehrávanie príbehu">
        <span>{playerIndex + 1}/{filtered.length} · {activeEvent.title}</span>
        <button className="album-control" onClick={() => movePlayer(-1)} disabled={playerIndex === 0} aria-label="Predchádzajúca udalosť"><ChevronLeft /></button>
        <button className="album-control" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pozastaviť príbeh' : 'Pokračovať v príbehu'}>{playing ? <Pause /> : <Play />}</button>
        <button className="album-control" onClick={() => movePlayer(1)} disabled={playerIndex === filtered.length - 1} aria-label="Nasledujúca udalosť"><ChevronRight /></button>
        <button className="album-control" onClick={() => { setPlaying(false); setPlayerOpen(false); }} aria-label="Ukončiť prehrávanie"><X /></button>
      </aside>}
      <Sheet open={Boolean(selected)} onOpenChange={open => { if (!open) closeEvent(); }}>
        <SheetContent side="right" className="event-sheet sm:!max-w-[min(860px,92vw)] !w-[min(860px,92vw)] !p-0 !gap-0" showCloseButton={false}>
          <SheetTitle className="sr-only">{selected?.title}</SheetTitle><SheetDescription className="sr-only">Detail udalosti z rodinného fotoalbumu</SheetDescription>
          <button className="detail-close" onClick={closeEvent} aria-label="Zatvoriť detail príbehu"><ArrowLeft /> Späť do albumu</button>
          {selected && <EventStory event={selected} />}
        </SheetContent>
      </Sheet>
    </main>
  );
}

function AboutUs({ active }: { active: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const section = sectionRef.current, panel = section?.parentElement;
    if (!section || !panel || !active) return;
    const measure = () => section.style.setProperty('--about-available-height', `${panel.clientHeight}px`);
    const observer = new ResizeObserver(measure);
    measure(); observer.observe(panel);
    return () => observer.disconnect();
  }, [active]);
  return (
<section ref={sectionRef} id="o-nas" className="album-about" aria-labelledby="about-title">
        <AboutSlideshow active={active} />
        <div className="about-copy">
          <p className="about-opening">Kde bolo, tam bolo, uprostred prenádhernej prírody žil raz jeden malý chlapec v malom domčeku…</p>
          <p>Takto začínajú všetky rozprávky na dobrú noc od času, keď sme si kúpili 1,5 ha pozemok, aby sme vytvorili <strong>rodový statok.</strong></p>
          <p>Naša cesta sa začala, keď sa nám narodil synček a začali sme riešiť zdravú stravu. To ma najprv priviedlo k Zuzke z Liferesetu, kde som sa dozvedela o permakultúre, následne k Jaroslavovi Slobodovi a po prečítaní jeho webu ku knihám <em>Anastasia</em> od Vladimíra Megreho.</p>
          <p>Práve Anastázia pre nás vytvorila krásny obraz rodových statkov – pozemku nie menšieho než 1 ha, kde rodina vytvorí svoj kúsok raja.</p>
          <p>Tri roky po tom, čo sme zatúžili mať rodový statok, sme sa presťahovali na náš pozemok, kde si tvoríme náš rodový statok, rajskú záhradu, <strong>náš priestor lásky.</strong></p>
          <blockquote className="about-personal-quote"><p>„Volám sa Zuzka a na rodovom statku žijem so svojím manželom, synom a dcérkou.“</p></blockquote>
          <p className="about-closing">Tento blog je o mojom rodovom statku, o mojej ceste životom. <em>Nech je pre vás inšpiráciou…</em></p>
        </div>
      </section>
  );
}
