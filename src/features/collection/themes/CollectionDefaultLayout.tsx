import React, { useLayoutEffect, useRef } from 'react';
import { CollectionPresentationProps, CollectionTheme } from './CollectionTheme';

export function CollectionDefaultLayout({ theme, ...props }: CollectionPresentationProps & { theme: CollectionTheme }) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const scroller = root.current;
    if (!scroller) return;
    const align = () => {
      const cards = scroller.querySelectorAll('[data-album-id]') as NodeListOf<HTMLElement>;
      const selected = Array.from(cards).find(item => item.dataset.albumId === props.selectedAlbumId);
      if (!selected) return;
      const frame = scroller.getBoundingClientRect(), card = selected.getBoundingClientRect();
      if (card.top < frame.top || card.bottom > frame.bottom) scroller.scrollTop += card.top - frame.top;
    };
    align();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(align);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [props.selectedAlbumId, theme.id]);
  const Presentation = theme.Presentation;
  return <div ref={root} className="ct-default" data-layout={theme.layout}><Presentation {...props} /></div>;
}
