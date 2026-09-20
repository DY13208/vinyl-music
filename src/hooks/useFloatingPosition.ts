import { PointerEvent as ReactPointerEvent, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { storageService } from '../platform/platformService';

type Side = 'left' | 'right';
interface SavedPosition { side: Side; xRatio: number; yRatio: number; }
interface Point { x: number; y: number; }

const STORAGE_KEY = 'floatingPlayerPosition';
const MARGIN = 14;

function readPosition(): SavedPosition {
  try {
    const parsed = JSON.parse(storageService.getItem(STORAGE_KEY) || 'null') as Partial<SavedPosition> | null;
    if (parsed && (parsed.side === 'left' || parsed.side === 'right')) return {
      side: parsed.side,
      xRatio: Math.min(1, Math.max(0, Number(parsed.xRatio) || (parsed.side === 'right' ? 1 : 0))),
      yRatio: Math.min(1, Math.max(0, Number(parsed.yRatio) || .76)),
    };
  } catch { /* A damaged preference should not hide playback controls. */ }
  return { side: 'right', xRatio: 1, yRatio: .76 };
}

export function useFloatingPosition(rootRef: RefObject<HTMLElement | null>, expanded: boolean) {
  const saved = useRef(readPosition());
  const drag = useRef<{ id: number; dx: number; dy: number; startX: number; startY: number; moved: boolean } | null>(null);
  const [point, setPoint] = useState<Point>({ x: -200, y: -200 });
  const [side, setSide] = useState<Side>(saved.current.side);
  const [dragging, setDragging] = useState(false);
  const suppressClick = useRef(false);

  const bounds = useCallback(() => {
    const root = rootRef.current;
    const host = root?.closest<HTMLElement>('#mobile-viewport');
    if (!root || !host) return null;
    const frame = host.getBoundingClientRect();
    const nav = host.querySelector<HTMLElement>('#bottom-navigation-bar')?.getBoundingClientRect();
    const width = root.offsetWidth || (expanded ? 260 : 56);
    const height = root.offsetHeight || 56;
    const sideNavigation = !!nav && nav.height > nav.width;
    const minX = frame.left + MARGIN + (sideNavigation && nav ? nav.width + 10 : 0);
    const maxX = Math.max(minX, frame.right - width - MARGIN);
    const minY = frame.top + MARGIN;
    const maxY = Math.max(minY, (sideNavigation || !nav ? frame.bottom - MARGIN : nav.top - 12) - height);
    return { minX, maxX, minY, maxY };
  }, [expanded, rootRef]);

  const restore = useCallback(() => {
    const area = bounds();
    if (!area) return;
    const stored = saved.current;
    setPoint({
      x: stored.side === 'left' ? area.minX : area.maxX,
      y: area.minY + (area.maxY - area.minY) * stored.yRatio,
    });
  }, [bounds]);

  useEffect(() => {
    restore();
    const root = rootRef.current;
    const host = root?.closest<HTMLElement>('#mobile-viewport');
    if (!root || !host || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(restore);
    observer.observe(host);
    observer.observe(root);
    return () => observer.disconnect();
  }, [restore, rootRef]);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('[data-floating-action]')) return;
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = { id: event.pointerId, dx: event.clientX - rect.left, dy: event.clientY - rect.top, startX: event.clientX, startY: event.clientY, moved: false };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const active = drag.current;
    const area = bounds();
    if (!active || active.id !== event.pointerId || !area) return;
    if (Math.hypot(event.clientX - active.startX, event.clientY - active.startY) > 4) {
      active.moved = true;
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!active.moved) return;
    setDragging(true);
    suppressClick.current = true;
    setPoint({
      x: Math.min(area.maxX, Math.max(area.minX, event.clientX - active.dx)),
      y: Math.min(area.maxY, Math.max(area.minY, event.clientY - active.dy)),
    });
  };
  const finishDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const active = drag.current;
    const area = bounds();
    if (!active || active.id !== event.pointerId || !area) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current = null;
    setDragging(false);
    if (!active.moved) return;
    const finalPoint = {
      x: Math.min(area.maxX, Math.max(area.minX, event.clientX - active.dx)),
      y: Math.min(area.maxY, Math.max(area.minY, event.clientY - active.dy)),
    };
    const nextSide: Side = finalPoint.x + event.currentTarget.offsetWidth / 2 < (area.minX + area.maxX + event.currentTarget.offsetWidth) / 2 ? 'left' : 'right';
    const yRatio = area.maxY === area.minY ? 0 : (finalPoint.y - area.minY) / (area.maxY - area.minY);
    saved.current = { side: nextSide, xRatio: nextSide === 'left' ? 0 : 1, yRatio };
    setSide(nextSide);
    setPoint({ x: nextSide === 'left' ? area.minX : area.maxX, y: finalPoint.y });
    try { storageService.setItem(STORAGE_KEY, JSON.stringify(saved.current)); } catch { /* Position persistence is non-critical. */ }
  };

  return {
    point, side, dragging, suppressClick,
    dragHandlers: { onPointerDown, onPointerMove, onPointerUp: finishDrag, onPointerCancel: finishDrag },
  };
}
