'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { aboutPhotos } from '@/lib/about-photos';

export function AboutSlideshow({ active }: { active: boolean }) {
  const frameRef = useRef<HTMLElement>(null);
  const requests = useRef(new Map<number, Promise<void>>());
  const requestId = useRef(0);
  const [current, setCurrent] = useState<number | null>(null);
  const [previous, setPrevious] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduced, setReduced] = useState(true);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback((index: number) => {
    const cached = requests.current.get(index);
    if (cached) return cached;
    const promise = new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => image.decode().then(resolve, reject);
      image.onerror = () => reject(new Error('Photo unavailable'));
      image.src = aboutPhotos[index].src;
    }).catch(error => { requests.current.delete(index); throw error; });
    requests.current.set(index, promise);
    return promise;
  }, []);

  const show = useCallback(async (index: number) => {
    const next = (index + aboutPhotos.length) % aboutPhotos.length;
    const id = ++requestId.current;
    setBusy(true); setFailed(false);
    try {
      await load(next);
      if (id !== requestId.current) return;
      setPrevious(reduced ? null : current);
      setCurrent(next);
    } catch {
      if (id === requestId.current) { setFailed(true); setPaused(true); }
    } finally { if (id === requestId.current) setBusy(false); }
  }, [current, reduced, load]);

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReduced(media.matches);
    const visibility = () => setPageVisible(!document.hidden);
    motion(); visibility();
    media.addEventListener('change', motion);
    document.addEventListener('visibilitychange', visibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .1 });
    if (frameRef.current) observer.observe(frameRef.current);
    return () => { observer.disconnect(); media.removeEventListener('change', motion); document.removeEventListener('visibilitychange', visibility); requestId.current++; };
  }, []);

  useEffect(() => {
    if (!active) { requestId.current++; setBusy(false); return; }
    if (current === null) void show(0);
  }, [active, current, show]);

  useEffect(() => {
    if (!active || current === null || !visible || !pageVisible) return;
    void load((current + 1) % aboutPhotos.length).catch(() => {});
  }, [active, current, visible, pageVisible, load]);

  useEffect(() => {
    if (!active || !visible || !pageVisible || paused || reduced || busy || current === null) return;
    const timer = window.setTimeout(() => void show(current + 1), 6000);
    return () => window.clearTimeout(timer);
  }, [active, visible, pageVisible, paused, reduced, busy, current, show]);

  useEffect(() => {
    if (previous === null) return;
    const timer = window.setTimeout(() => setPrevious(null), reduced ? 0 : 1200);
    return () => window.clearTimeout(timer);
  }, [previous, current, reduced]);

  const move = (direction: number) => { setPaused(true); void show((current ?? 0) + direction); };
  return (
    <figure ref={frameRef} className="about-slideshow" role="region" aria-roledescription="premietanie fotografií" aria-label="Fotografie z nášho života" tabIndex={0} onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
    }}>
      {[previous, current].filter((index): index is number => index !== null).map((index, layer) => {
        const photo = aboutPhotos[index];
        return <div key={index} className={`about-photo-layer ${previous !== null && layer === 1 ? 'is-entering' : ''}`} aria-hidden={index !== current}>
          <div className="about-photo-atmosphere" aria-hidden="true"><img src={photo.src} alt="" /></div>
          <img className="about-photo" src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} />
        </div>;
      })}
      {failed && <p className="about-photo-error" role="status">Fotografiu sa nepodarilo načítať. Skúste prejsť na ďalšiu.</p>}
      <figcaption className="about-photo-controls">
        <button type="button" className="album-control" onClick={() => move(-1)} disabled={busy} aria-label="Predchádzajúca fotografia O nás"><ChevronLeft /></button>
        <span aria-live={paused ? 'polite' : 'off'}>{current === null ? '…' : current + 1} / {aboutPhotos.length}</span>
        <button type="button" className="album-control" onClick={() => move(1)} disabled={busy} aria-label="Nasledujúca fotografia O nás"><ChevronRight /></button>
        <button type="button" className="album-control" disabled={reduced} onClick={() => setPaused(!paused)} aria-label={reduced ? 'Automatické premietanie vypnuté pre obmedzený pohyb' : paused ? 'Spustiť premietanie fotografií' : 'Pozastaviť premietanie fotografií'}>{paused || reduced ? <Play /> : <Pause />}</button>
      </figcaption>
    </figure>
  );
}
