import { useState, useCallback } from 'react';
import { Album, VinylRecord, VinylSide } from '../types';

/**
 * 播放器翻面状态管理 Hook
 * 
 * 负责追踪当前显示的唱片面（A/B/C/D）和光盘
 * 支持多 LP：Disc 1 的 A/B、Disc 2 的 C/D
 */
export interface PlayerSideState {
  /** 当前光盘编号 */
  currentDisc: number;
  /** 当前面 ('A' | 'B' | 'C' | 'D' etc.) */
  currentSide: string;
}

export const usePlayerSideState = (album: Album | null) => {
  const [sideState, setSideState] = useState<PlayerSideState>({
    currentDisc: 1,
    currentSide: 'A',
  });

  /**
   * 获取当前显示的唱片面对象
   */
  const getCurrentVinylSide = useCallback((): VinylSide | null => {
    if (!album?.discs) return null;
    
    const disc = album.discs.find((d) => d.disc === sideState.currentDisc);
    if (!disc) return null;
    
    return disc.sides.find((s) => s.side === sideState.currentSide) || null;
  }, [album, sideState]);

  /**
   * 翻到特定面
   */
  const switchToSide = useCallback((disc: number, side: string) => {
    setSideState({ currentDisc: disc, currentSide: side });
  }, []);

  /**
   * 翻到下一面（同光盘内循环）
   */
  const nextSide = useCallback(() => {
    if (!album?.discs) return;
    
    const disc = album.discs.find((d) => d.disc === sideState.currentDisc);
    if (!disc) return;
    
    const currentIndex = disc.sides.findIndex((s) => s.side === sideState.currentSide);
    const nextIndex = (currentIndex + 1) % disc.sides.length;
    
    setSideState({
      currentDisc: sideState.currentDisc,
      currentSide: disc.sides[nextIndex].side,
    });
  }, [album, sideState.currentDisc, sideState.currentSide]);

  /**
   * 翻到上一面（同光盘内循环）
   */
  const prevSide = useCallback(() => {
    if (!album?.discs) return;
    
    const disc = album.discs.find((d) => d.disc === sideState.currentDisc);
    if (!disc) return;
    
    const currentIndex = disc.sides.findIndex((s) => s.side === sideState.currentSide);
    const prevIndex = (currentIndex - 1 + disc.sides.length) % disc.sides.length;
    
    setSideState({
      currentDisc: sideState.currentDisc,
      currentSide: disc.sides[prevIndex].side,
    });
  }, [album, sideState.currentDisc, sideState.currentSide]);

  /**
   * 重置状态（切换专辑时调用）
   */
  const reset = useCallback(() => {
    setSideState({ currentDisc: 1, currentSide: 'A' });
  }, []);

  /**
   * 获取所有可用的面列表
   */
  const getAvailableSides = useCallback((): VinylSide[] => {
    if (!album?.discs) return [];
    
    const disc = album.discs.find((d) => d.disc === sideState.currentDisc);
    return disc?.sides || [];
  }, [album, sideState.currentDisc]);

  /**
   * 获取所有光盘
   */
  const getDiscs = useCallback((): VinylRecord[] => {
    return album?.discs || [];
  }, [album]);

  return {
    // State
    currentDisc: sideState.currentDisc,
    currentSide: sideState.currentSide,
    
    // Getters
    getCurrentVinylSide,
    getAvailableSides,
    getDiscs,
    
    // Actions
    switchToSide,
    nextSide,
    prevSide,
    reset,
  };
};
