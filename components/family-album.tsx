'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Leaf, Minus, Plus, RotateCcw, SlidersHorizontal, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Field as SliderField } from '@base-ui/react/field';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EventCardDialog } from './event-card-dialog';
import type { StoryRecord } from '@/lib/stories';
import { formatDate, RotatingEventMedia } from '@/components/timeline-story';
import { albumColumns, albumPeriod, estateDuration } from '@/lib/album';
import { AboutSlideshow } from '@/components/about-slideshow';
import type { EventRecord } from '@/lib/events';

const categoryNames = ['Slameno-hlinený dom', 'Slameno-hlinená chatka', 'Záhrada', 'Plot', 'Zvieratá', 'Rodina a život', 'Jazierko', 'Iné stavby', 'Rodový statok', 'Miľníky'];
const months = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'];
const sizes = ['Malé', 'Stredné', 'Veľké'];
type Anchor = { id: string; offset: number; bottom: boolean };

function AlbumTile({ event, zoom, active, onOpen }: { event: EventRecord; zoom: number; active: boolean; onOpen: (event: EventRecord) => void }) {
  return (
    <article id={`udalost-${event.id}`} data-event-id={event.id} className="album-tile">
      <RotatingEventMedia event={event} active={active && zoom > 0} />
      <button className="album-tile-open" onClick={() => onOpen(event)} aria-label={`Zväčšiť udalosť: ${event.title}, ${formatDate(event)}`} />
      {zoom > 0 && event.featured && <span className="album-milestone album-milestone-badge"><Star fill="currentColor" aria-hidden="true" /> Míľnik</span>}
      {zoom > 0 && <div className="album-tile-copy">
        <div className="album-tile-meta"><time dateTime={event.datePrecision === 'year' ? event.date.slice(0, 4) : event.datePrecision === 'month' ? event.date.slice(0, 7) : event.date}>{formatDate(event)}</time></div>
        <h2>{event.title}</h2>
        {zoom === 2 && <><div className="album-tile-categories">{event.categories.join(' · ')}</div><p>{event.summary}</p>{event.storyId && <a className="event-story-link" href={`/pribeh/${event.storyId}`}>Čítať príbeh →</a>}</>}
      </div>}
    </article>
  );
}

export function FamilyAlbum({ events, stories, initialNow, initialEventId }: { events: EventRecord[]; stories: StoryRecord[]; initialNow: string; initialEventId?: string }) {
  const [tab, setTab] = useState('events');
  const [duration, setDuration] = useState(() => estateDuration(new Date(initialNow)));
  const [year, setYear] = useState('all');
  const [month, setMonth] = useState('all');
  const [category, setCategory] = useState('all');
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [period, setPeriod] = useState('');
  const [restored, setRestored] = useState(false);
  const [selected, setSelected] = useState<EventRecord | null>(() => events.find(event => event.id === initialEventId) || null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<Anchor | null>(null);
  const lastFilter = useRef('');
  const frame = useRef(0);
  const returnFocus = useRef<HTMLElement | null>(null);
  const openedFromAlbum = useRef(false);
  const years = useMemo(() => [...new Set(events.map(event => event.date.slice(0, 4)))].sort(), [events]);
  const filtered = useMemo(() => events
    .filter(event => year === 'all' || event.date.startsWith(year))
    .filter(event => month === 'all' || (event.datePrecision !== 'year' && Number(event.date.slice(5, 7)) === Number(month)))
    .filter(event => category === 'all' || event.categories.includes(category))
    .sort((a, b) => a.date.localeCompare(b.date)), [events, year, month, category]);
  const columns = albumColumns(width, zoom);
  const filterKey = `${year}|${month}|${category}`;
  const hasFilters = year !== 'all' || month !== 'all' || category !== 'all';

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('family-album-position') || 'null');
      if (saved && [0, 1, 2].includes(saved.zoom) && typeof saved.year === 'string' && typeof saved.month === 'string' && typeof saved.category === 'string') {
        setZoom(saved.zoom); setYear(saved.year); setMonth(saved.month); setCategory(saved.category);
        anchorRef.current = saved.anchor;
        lastFilter.current = `${saved.year}|${saved.month}|${saved.category}`;
      }
    } catch { /* Storage may be unavailable in private browsing. */ }
    setRestored(true);
  }, []);

  useEffect(() => {
    const save = () => {
      try { sessionStorage.setItem('family-album-position', JSON.stringify({ zoom, year, month, category, anchor: anchorRef.current })); } catch { /* Optional position persistence. */ }
    };
    window.addEventListener('pagehide', save);
    return () => window.removeEventListener('pagehide', save);
  }, [zoom, year, month, category]);

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
    if (!viewport || tab !== 'events' || !width || !restored) return;
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
  }, [width, height, zoom, tab, filterKey, filtered, capturePosition, restored]);

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
  const openEvent = (event: EventRecord) => {
    capturePosition();
    returnFocus.current = document.activeElement as HTMLElement;
    openedFromAlbum.current = true;
    history.pushState({ albumEvent: event.id }, '', `/#pribeh&udalost=${encodeURIComponent(event.id)}`);
    setSelected(event);
  };
  const closeEvent = () => {
    if (!returnFocus.current?.isConnected) returnFocus.current = viewportRef.current;
    setSelected(null);
    if (openedFromAlbum.current) { openedFromAlbum.current = false; history.back(); }
    else history.replaceState({}, '', '/#pribeh');
  };
  const changeTab = (value: string) => {
    capturePosition();
    setTab(value);
    history.pushState({}, '', value === 'stories' ? '/#pribehy' : value === 'about' ? '/#o-nas' : '/#pribeh');
  };
  useEffect(() => {
    const syncLocation = () => {
      const hash = location.hash;
      setTab(hash === '#pribehy' ? 'stories' : hash === '#o-nas' ? 'about' : 'events');
      const id = new URLSearchParams(hash.slice(1)).get('udalost');
      const pathId = location.pathname.startsWith('/pribeh/') ? decodeURIComponent(location.pathname.slice(8)) : null;
      openedFromAlbum.current = Boolean(history.state?.albumEvent);
      setSelected(events.find(event => event.id === (id || pathId)) || null);
    };
    syncLocation();
    window.addEventListener('popstate', syncLocation);
    window.addEventListener('hashchange', syncLocation);
    return () => { window.removeEventListener('popstate', syncLocation); window.removeEventListener('hashchange', syncLocation); };
  }, [events]);

  return (
    <main className="family-album">
      <Tabs value={tab} onValueChange={value => changeTab(String(value))} className="album-shell">
        <header className="album-header">
          <img className="album-logo" src="/images/logo-uprostred-prirody.png" alt="" width={1202} height={1199} />
          <div className="album-brand">Rodový statok</div>
          <h1>Uprostred <em>prírody</em></h1>
          <p><span className="album-intro-name">Som Zuzka.</span> Spolu s mojou rodinou tvoríme rodový statok už <strong>{duration}</strong>.</p>
          <TabsList variant="line" className="album-tabs" aria-label="Hlavná navigácia"><TabsTrigger value="events">Udalosti</TabsTrigger><TabsTrigger value="stories">Príbehy</TabsTrigger><TabsTrigger value="about">O nás</TabsTrigger></TabsList>
        </header>
        <TabsContent value="events" keepMounted className="album-events">
          <div className="album-toolbar">
            <div className="album-period" aria-label="Práve zobrazené obdobie">{period || (filtered.length ? albumPeriod(filtered[filtered.length - 1]) : 'Žiadne udalosti')}</div>
            <div className="album-actions">
              <Popover><PopoverTrigger className={`album-control ${hasFilters ? 'is-active' : ''}`} aria-label={hasFilters ? 'Filtre, aktívne filtrovanie' : 'Filtre'}><SlidersHorizontal /></PopoverTrigger>
                <PopoverContent className="album-filters" align="end">
                  <PopoverTitle>Filtrovať udalosti</PopoverTitle>
                  <Select value={year} onValueChange={v => setYear(String(v))}><SelectTrigger aria-label="Vybrať rok"><SelectValue>{year === 'all' ? 'Všetky roky' : year}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">Všetky roky</SelectItem>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
                  <Select value={month} onValueChange={v => setMonth(String(v))}><SelectTrigger aria-label="Vybrať mesiac"><SelectValue>{month === 'all' ? 'Všetky mesiace' : months[Number(month) - 1]}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">Všetky mesiace</SelectItem>{months.map((name, i) => <SelectItem key={name} value={String(i + 1)}>{name}</SelectItem>)}</SelectContent></Select>
                  <Select value={category} onValueChange={v => setCategory(String(v))}><SelectTrigger aria-label="Vybrať kategóriu"><SelectValue>{category === 'all' ? 'Všetky kategórie' : category}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">Všetky kategórie</SelectItem>{categoryNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select>
                  <span aria-live="polite">{filtered.length} z {events.length} udalostí</span>
                  <button className="album-control" onClick={clearFilters} disabled={!hasFilters}><RotateCcw /> Zrušiť filtre</button>
                </PopoverContent>
              </Popover>
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
        <TabsContent value="stories" keepMounted className="album-stories">
          <div className="story-cards">{stories.map(story => <a className="story-card" href={`/pribeh/${story.id}`} key={story.id}>
            <img src={story.coverImage} alt={story.gallery.find(photo => photo.src === story.coverImage)?.alt || story.title} />
            <div><h2>{story.title}</h2><p>{story.summary}</p><span>Čítať príbeh →</span></div>
          </a>)}</div>
        </TabsContent>
        <TabsContent value="about" keepMounted className="album-about-tab">
          <div className="album-toolbar album-about-toolbar"><h2 id="about-title">Za každým miestom sú <em>ľudia.</em></h2></div>
          <div className="album-about-panel"><AboutUs active={tab === 'about'} /></div>
        </TabsContent>
      </Tabs>
      <EventCardDialog event={selected} onClose={closeEvent} returnFocus={returnFocus} />
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
