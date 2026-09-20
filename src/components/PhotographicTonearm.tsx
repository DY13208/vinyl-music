import React, { useEffect, useRef, useState } from 'react';

interface Props { albumId: string; isPlaying: boolean; progressPercent: number; stopped?: boolean; }

/** The image's bearing is at 50% / 21%; keep this node alive when the record changes. */
export const PhotographicTonearm: React.FC<Props> = ({ albumId, isPlaying, progressPercent, stopped = false }) => {
  const angle = 25 + Math.min(100, Math.max(0, Number.isFinite(progressPercent) ? progressPercent : 0)) * .18;
  const latest = useRef({ isPlaying, angle, stopped });
  latest.current = { isPlaying, angle, stopped };
  const previousAlbum = useRef(albumId);
  const returning = useRef(false);
  const [pose, setPose] = useState({ angle: 0, phase: 'rest' });

  useEffect(() => {
    if (previousAlbum.current === albumId) return;
    previousAlbum.current = albumId;
    returning.current = true;
    setPose({ angle: 0, phase: 'returning' });
    const timer = setTimeout(() => {
      returning.current = false;
      const current = latest.current;
      setPose(current.isPlaying && !current.stopped ? { angle: current.angle, phase: 'cueing' } : { angle: 0, phase: 'rest' });
    }, 600);
    return () => { clearTimeout(timer); returning.current = false; };
  }, [albumId]);

  useEffect(() => {
    if (returning.current) return;
    if (stopped) setPose({ angle: 0, phase: 'returning' });
    else if (isPlaying) setPose(previous => ({ angle, phase: previous.phase === 'rest' || previous.phase === 'returning' ? 'cueing' : 'tracking' }));
    // Pause holds the physical position; it is not a stop command.
  }, [isPlaying, angle, stopped]);

  return <img className="turntable-tonearm" src="/assets/turntable/tonearm.webp" alt="" draggable={false}
    data-phase={pose.phase} data-angle={pose.angle} style={{ transform: `rotate(${pose.angle}deg)` }} />;
};
