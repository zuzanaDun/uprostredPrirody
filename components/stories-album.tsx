'use client';

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Leaf, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { albumColumns } from '@/lib/album';
import { filterStories } from '@/lib/story-filters';
import type { StoryRecord } from '@/lib/stories';

const months = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'];

export function StoriesAlbum({ stories }: { stories: StoryRecord[] }) {
  const [year, setYear] = useState('all');
  const [month, setMonth] = useState('all');
  const [category, setCategory] = useState('all');
  const [width, setWidth] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const categories = useMemo(() => [...new Set(stories.flatMap(story => story.categories))].sort((a, b) => a.localeCompare(b, 'sk')), [stories]);
  const years = useMemo(() => [...new Set(stories.map(story => story.date.slice(0, 4)))].sort(), [stories]);
  const filtered = useMemo(() => filterStories(stories, year, month, category), [stories, year, month, category]);
  const active = year !== 'all' || month !== 'all' || category !== 'all';
  const reset = () => { setYear('all'); setMonth('all'); setCategory('all'); };

  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setWidth(element.clientWidth));
    setWidth(element.clientWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => { if (viewport.current) viewport.current.scrollTop = 0; }, [year, month, category]);

  return <>
    <div className="album-toolbar stories-toolbar">
      <Popover>
        <PopoverTrigger className={`album-control ${active ? 'is-active' : ''}`} aria-label={active ? 'Filtre príbehov, aktívne filtrovanie' : 'Filtre príbehov'}><SlidersHorizontal /></PopoverTrigger>
        <PopoverContent className="album-filters" align="start">
          <PopoverTitle>Filtrovať príbehy</PopoverTitle>
          <Select value={year} onValueChange={value => setYear(String(value))}><SelectTrigger aria-label="Rok príbehu"><SelectValue>{year === 'all' ? 'Všetky roky' : year}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">Všetky roky</SelectItem>{years.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
          <Select value={month} onValueChange={value => setMonth(String(value))}><SelectTrigger aria-label="Mesiac príbehu"><SelectValue>{month === 'all' ? 'Všetky mesiace' : months[Number(month) - 1]}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">Všetky mesiace</SelectItem>{months.map((name, index) => <SelectItem key={name} value={String(index + 1)}>{name}</SelectItem>)}</SelectContent></Select>
          <span>{filtered.length} z {stories.length} príbehov</span>
          <button className="album-control" onClick={reset} disabled={!active}><RotateCcw /> Zrušiť filtre</button>
        </PopoverContent>
      </Popover>
      <div className="story-categories" role="group" aria-label="Kategórie príbehov">
        {['all', ...categories].map(value => <button key={value} className="story-category" aria-pressed={category === value} onClick={() => setCategory(value)}>{value === 'all' ? 'Všetky' : value}</button>)}
      </div>
    </div>
    <div className="stories-viewport" ref={viewport}>
      <span className="sr-only" role="status">Zobrazené príbehy: {filtered.length}</span>
      {filtered.length ? <div className="album-grid album-size-2 story-cards" style={{ '--album-columns': albumColumns(width, 2) } as CSSProperties}>
        {filtered.map(story => <a className="album-tile story-card" href={`/pribeh/${story.id}`} key={story.id}>
          <img src={story.coverImage} alt={story.gallery.find(photo => photo.src === story.coverImage)?.alt || story.title} />
          <div className="album-tile-copy"><h2>{story.title}</h2><div className="album-tile-categories">{story.categories.join(' · ')}</div><p>{story.summary}</p><span className="event-story-link">Čítať príbeh →</span></div>
        </a>)}
      </div> : <div className="album-empty"><Leaf /><h2>Nenašli sa žiadne príbehy</h2><p>Skúste inú kategóriu alebo obdobie.</p><button className="album-control" onClick={reset}><RotateCcw /> Zrušiť filtre</button></div>}
    </div>
  </>;
}
