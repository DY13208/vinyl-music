import { useEffect, useRef, useState } from 'react';

export type SideTransitionPhase = 'idle' | 'out' | 'in';
interface Selection { disc: number; side: number; }
const sameSide = (a: Selection, b: Selection) => a.disc === b.disc && a.side === b.side;

/** One commit updates the label, selected tab, metadata and tracks together. */
export function useVinylSideTransition() {
  const [state, setState] = useState<{ selection: Selection; target: Selection; phase: SideTransitionPhase }>({
    selection: { disc: 0, side: 0 }, target: { disc: 0, side: 0 }, phase: 'idle',
  });
  const stateRef = useRef(state);
  stateRef.current = state;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cancel = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => cancel(), []);

  const selectSide = (target: Selection) => {
    const current = stateRef.current;
    if (sameSide(current.target, target)) return;
    cancel();
    const update = (next: typeof state) => { stateRef.current = next; setState(next); };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      update({ selection: target, target, phase: 'idle' });
      return;
    }
    // Reversing an uncommitted request simply restores the current face.
    if (sameSide(current.selection, target)) {
      update({ selection: target, target, phase: 'in' });
      timers.current.push(setTimeout(() => update({ selection: target, target, phase: 'idle' }), 180));
      return;
    }
    update({ ...current, target, phase: 'out' });
    timers.current.push(setTimeout(() => {
      update({ selection: target, target, phase: 'in' });
      timers.current.push(setTimeout(() => update({ selection: target, target, phase: 'idle' }), 180));
    }, 120));
  };
  return { ...state, selectSide };
}
