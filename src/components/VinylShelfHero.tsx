import React, { useEffect, useRef, useState } from 'react';
import { animate, motion, MotionValue, PanInfo, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { Album } from '../types';
import { VinylCarouselItem } from './VinylCarouselItem';
import { audioEngine } from '../services/audioEngine';

interface VinylShelfHeroProps {
  albums: Album[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  onOpenAlbumDetail?: (album: Album) => void;
}

const ITEM_SPACING = 250;
const SPRING = { type: 'spring' as const, stiffness: 155, damping: 25, mass: 0.95 };
const modulo = (value: number, length: number) => ((value % length) + length) % length;

const CarouselRecord: React.FC<{
  album: Album;
  occurrence: number;
  trackX: MotionValue<number>;
  active: boolean;
  reduceMotion: boolean | null;
  dragging: React.MutableRefObject<boolean>;
  onActivate: () => void;
}> = ({ album, occurrence, trackX, active, reduceMotion, dragging, onActivate }) => {
  const distance = useTransform(trackX, (value) => occurrence + value / ITEM_SPACING);
  const scale = useTransform(distance, (value) => 1 - Math.min(1, Math.abs(value)) * 0.13);
  const opacity = useTransform(distance, (value) => 1 - Math.min(1, Math.abs(value)) * 0.55);
  const rotateY = useTransform(distance, (value) => Math.max(-7, Math.min(7, value * -6.5)));
  const zIndex = useTransform(distance, (value) => Math.abs(value) < 0.5 ? 5 : Math.abs(value) < 1.5 ? 2 : 1);
  const filter = useTransform(distance, (value) => {
    const amount = Math.min(1, Math.abs(value));
    return `brightness(${1 - amount * 0.24}) blur(${amount * 0.45}px)`;
  });

  return (
    <motion.button
      type="button"
      className="vinyl-carousel__item"
      style={{
        x: occurrence * ITEM_SPACING,
        zIndex: reduceMotion ? (active ? 5 : 1) : zIndex,
        scale: reduceMotion ? (active ? 1 : .87) : scale,
        opacity: reduceMotion ? (active ? 1 : .45) : opacity,
        rotateY: reduceMotion ? 0 : rotateY,
        filter: reduceMotion ? 'none' : filter,
      }}
      onClick={() => { if (!dragging.current) onActivate(); }}
      aria-label={active ? `打开专辑：${album.title}` : `切换到专辑：${album.title}`}
      aria-current={active ? 'true' : undefined}
    >
      <VinylCarouselItem album={album} />
    </motion.button>
  );
};

const EdgePreview: React.FC<{ album: Album; occurrence: number; side: -1 | 1; trackX: MotionValue<number> }> = ({ album, occurrence, side, trackX }) => {
  const distance = useTransform(trackX, (value) => occurrence + value / ITEM_SPACING);
  const opacity = useTransform(distance, (value) => {
    const amount = Math.abs(value);
    return Math.max(0, Math.min(.5, ((amount - .68) / .32) * .5));
  });
  return (
    <motion.div
      className={`vinyl-carousel__item vinyl-carousel__edge-preview is-${side < 0 ? 'left' : 'right'}`}
      style={{ x: occurrence * ITEM_SPACING, opacity }}
      aria-hidden="true"
    >
      <VinylCarouselItem album={album} />
    </motion.div>
  );
};

export const VinylShelfHero: React.FC<VinylShelfHeroProps> = ({ albums, currentIndex, onSelectIndex, onOpenAlbumDetail }) => {
  const [virtualIndex, setVirtualIndex] = useState(currentIndex);
  const virtualIndexRef = useRef(currentIndex);
  const trackX = useMotionValue(-currentIndex * ITEM_SPACING);
  const dragging = useRef(false);
  const transitionSequence = useRef(0);
  const animationRef = useRef<{ stop: () => void } | null>(null);
  const reduceMotion = useReducedMotion();

  const settleTo = async (targetVirtualIndex: number) => {
    const sequence = ++transitionSequence.current;
    animationRef.current?.stop();
    const controls = animate(trackX, -targetVirtualIndex * ITEM_SPACING, reduceMotion ? { duration: 0 } : SPRING);
    animationRef.current = controls;
    try {
      await controls.finished;
    } catch {
      return;
    }
    if (sequence !== transitionSequence.current) return;

    const changed = targetVirtualIndex !== virtualIndexRef.current;
    virtualIndexRef.current = targetVirtualIndex;
    setVirtualIndex(targetVirtualIndex);
    onSelectIndex(modulo(targetVirtualIndex, albums.length));
    animationRef.current = null;
    if (changed) audioEngine.triggerHaptic('light');
  };

  useEffect(() => {
    if (!albums.length) return;
    if (modulo(virtualIndexRef.current, albums.length) === currentIndex) return;
    transitionSequence.current += 1;
    animationRef.current?.stop();
    virtualIndexRef.current = currentIndex;
    setVirtualIndex(currentIndex);
    trackX.set(-currentIndex * ITEM_SPACING);
  }, [albums.length, currentIndex, trackX]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const step = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
      if (step && albums.length > 1) void settleTo(virtualIndexRef.current + step);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  useEffect(() => () => {
    transitionSequence.current += 1;
    animationRef.current?.stop();
  }, []);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    window.setTimeout(() => { dragging.current = false; }, 0);
    const projected = info.offset.x + Math.max(-700, Math.min(700, info.velocity.x)) * 0.11;
    const direction = projected < -62 ? 1 : projected > 62 ? -1 : 0;
    void settleTo(virtualIndexRef.current + direction);
  };

  if (!albums.length) return null;
  const occurrences = [-2, -1, 0, 1, 2].map((offset) => virtualIndex + offset);
  const restingX = -virtualIndex * ITEM_SPACING;

  return (
    <div className="vinyl-carousel" aria-label="左右滑动浏览唱片">
      <motion.div
        className="vinyl-carousel__track"
        style={{ x: trackX }}
        drag="x"
        dragConstraints={{ left: restingX, right: restingX }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragStart={() => {
          transitionSequence.current += 1;
          animationRef.current?.stop();
          animationRef.current = null;
          dragging.current = true;
        }}
        onDragEnd={handleDragEnd}
      >
        {([-1, 1] as const).map((offset) => {
          const occurrence = virtualIndex + offset;
          const album = albums[modulo(occurrence, albums.length)];
          return <EdgePreview key={`edge:${album.id}:${occurrence}`} album={album} occurrence={occurrence} side={offset} trackX={trackX} />;
        })}
        {occurrences.map((occurrence) => {
          const album = albums[modulo(occurrence, albums.length)];
          const active = occurrence === virtualIndex;
          return (
            <CarouselRecord
              key={`${album.id}:${occurrence}`}
              album={album}
              occurrence={occurrence}
              trackX={trackX}
              active={active}
              reduceMotion={reduceMotion}
              dragging={dragging}
              onActivate={() => active ? onOpenAlbumDetail?.(album) : void settleTo(occurrence)}
            />
          );
        })}
      </motion.div>
    </div>
  );
};
