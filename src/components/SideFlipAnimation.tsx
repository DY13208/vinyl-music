import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SideFlipAnimationProps {
  /**
   * 翻面是否在进行中（控制动画状态）
   */
  isFlipping: boolean;
  
  /**
   * 前一面的内容（渐出）
   */
  exitContent: React.ReactNode;
  
  /**
   * 新面的内容（渐入）
   */
  enterContent: React.ReactNode;
  
  /**
   * 动画时长（毫秒），建议 180-250ms
   */
  duration?: number;
  
  /**
   * 是否尊重 prefers-reduced-motion 系统设置
   */
  respectMotionPreference?: boolean;
  
  /**
   * 容器 className
   */
  className?: string;
}

/**
 * 唱片翻面动画组件
 * 
 * 显示唱片在翻面时的收窄、换面、展开效果
 * 支持关闭动画时直接切换
 */
export const SideFlipAnimation: React.FC<SideFlipAnimationProps> = ({
  isFlipping,
  exitContent,
  enterContent,
  duration = 200,
  respectMotionPreference = true,
  className = '',
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (!respectMotionPreference) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [respectMotionPreference]);

  // 如果尊重系统设置且用户选择了减少动画，直接显示新内容
  if (respectMotionPreference && prefersReducedMotion) {
    return (
      <div className={className}>
        {isFlipping ? enterContent : exitContent}
      </div>
    );
  }

  const animationDuration = prefersReducedMotion ? 0 : duration / 1000; // 转换为秒

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {!isFlipping ? (
          <motion.div
            key="exit-side"
            className="player-stage-motion w-full h-full"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: animationDuration }}
          >
            {exitContent}
          </motion.div>
        ) : (
          <motion.div
            key="enter-side"
            className="player-stage-motion w-full h-full"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: animationDuration }}
          >
            {enterContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
