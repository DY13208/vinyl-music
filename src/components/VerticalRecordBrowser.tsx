import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { Album } from '../types';
import { VinylCarouselItem } from './VinylCarouselItem';

interface Props {
  albums: Album[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  onOpenAlbumDetail: (album: Album) => void;
}

/** Native scrolling keeps touch momentum, trackpads and keyboard in one flow. */
export function VerticalRecordBrowser({ albums, currentIndex, onSelectIndex, onOpenAlbumDetail }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const selected = useRef(currentIndex);
  const emitted = useRef<number | null>(null);
  const programmaticTarget = useRef<number | null>(null);
  const recenterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointer = useRef<{ id: number; y: number; top: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const reducedMotion = useReducedMotion();
  selected.current = currentIndex;
  const looping = albums.length > 1;
  const displayAlbums = looping
    ? [0, 1, 2].flatMap(copy => albums.map((album, realIndex) => ({ album, realIndex, clone: copy !== 1 })))
    : albums.map((album, realIndex) => ({ album, realIndex, clone: false }));
  const toVirtualIndex = (realIndex: number) => looping ? albums.length + realIndex : realIndex;
  const getStep = (element: HTMLDivElement) =>
    (element.firstElementChild as HTMLElement | null)?.offsetHeight || Math.max(1, element.clientHeight * 0.58);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    if (emitted.current === currentIndex) { emitted.current = null; return; }
    const target = toVirtualIndex(currentIndex);
    programmaticTarget.current = target;
    element.scrollTo({ top: target * getStep(element), behavior: reducedMotion ? 'instant' : 'smooth' });
  }, [currentIndex, albums.length, reducedMotion]);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const align = () => {
      programmaticTarget.current = null;
      element.scrollTo({ top: toVirtualIndex(selected.current) * getStep(element), behavior: 'instant' });
    };
    align();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(align);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    if (recenterTimer.current) clearTimeout(recenterTimer.current);
  }, []);

  return <div className="record-browser" ref={scroller} tabIndex={0} role="region"
    aria-label="上下滑动浏览唱片，也可使用上下方向键" aria-roledescription="唱片浏览器"
    onScroll={event => {
      const element = event.currentTarget;
      const step = getStep(element);
      const virtualIndex = Math.max(0, Math.min(displayAlbums.length - 1, Math.round(element.scrollTop / step)));
      const target = programmaticTarget.current;
      if (target !== null) {
        if (Math.abs(element.scrollTop - target * step) < 2) programmaticTarget.current = null;
        return;
      }
      const index = displayAlbums[virtualIndex]?.realIndex ?? 0;
      if (recenterTimer.current) clearTimeout(recenterTimer.current);
      if (looping && (virtualIndex < albums.length || virtualIndex >= albums.length * 2)) {
        recenterTimer.current = setTimeout(() => {
          const matchingVirtualIndex = albums.length + index;
          programmaticTarget.current = matchingVirtualIndex;
          element.scrollTo({ top: matchingVirtualIndex * getStep(element), behavior: 'instant' });
        }, 90);
      }
      if (index !== selected.current) { emitted.current = index; onSelectIndex(index); }
    }}
    onWheel={() => { programmaticTarget.current = null; }}
    onKeyDown={event => {
      const next = event.key === 'ArrowDown' ? (currentIndex + 1) % albums.length : event.key === 'ArrowUp' ? (currentIndex - 1 + albums.length) % albums.length : event.key === 'Home' ? 0 : event.key === 'End' ? albums.length - 1 : null;
      if (next === null) return;
      event.preventDefault();
      onSelectIndex(next);
    }}
    onPointerDown={event => {
      programmaticTarget.current = null;
      suppressClick.current = false;
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      pointer.current = { id: event.pointerId, y: event.clientY, top: event.currentTarget.scrollTop, moved: false };
    }}
    onPointerMove={event => {
      const drag = pointer.current;
      if (!drag || drag.id !== event.pointerId) return;
      const delta = event.clientY - drag.y;
      if (Math.abs(delta) > 5) {
        drag.moved = true; suppressClick.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.style.scrollSnapType = 'none';
      }
      if (drag.moved) event.currentTarget.scrollTop = drag.top - delta;
    }}
    onPointerUp={event => {
      if (!pointer.current) return;
      event.currentTarget.style.scrollSnapType = '';
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      pointer.current = null;
    }}
    onPointerCancel={event => { pointer.current = null; event.currentTarget.style.scrollSnapType = ''; }}
    onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}>
    {displayAlbums.map(({ album, realIndex, clone }, virtualIndex) => <div className={`record-browser__slot ${realIndex === currentIndex ? 'is-selected' : ''}`} key={`${album.id}-${virtualIndex}`} aria-hidden={clone || undefined}>
      <button type="button" className="record-browser__record" tabIndex={!clone && realIndex === currentIndex ? 0 : -1}
        aria-current={!clone && realIndex === currentIndex ? 'true' : undefined}
        aria-label={`${realIndex === currentIndex ? '打开' : '浏览'}专辑：${album.title}`}
        onDragStart={event => event.preventDefault()}
        onClick={() => realIndex === currentIndex ? onOpenAlbumDetail(album) : onSelectIndex(realIndex)}>
        <VinylCarouselItem album={album} />
      </button>
    </div>)}
  </div>;
}
