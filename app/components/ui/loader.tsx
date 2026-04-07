'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { BackgroundBeams } from './BackgroundBeams';

export interface LoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  position?: 'bottom' | 'center' | 'top';
}

export const Loader = ({
  text = 'Загрузка...',
  size = 'md',
  className,
  position = 'center' // ← По умолчанию center
}: LoaderProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(saved as 'light' | 'dark');//eslint-disable-line
  }, []);

  const isDark = theme === 'dark';

  const getPositionStyles = () => {
    switch (position) {
      case 'bottom':
        return {
          wrapper: 'fixed bottom-0 left-0 right-0 px-6 py-4',
          align: 'items-center',
          gradient: isDark
            ? 'from-neutral-950/95 via-neutral-950/60 to-transparent'
            : 'from-white/95 via-white/60 to-transparent',
          gradientDir: 'bg-linear-to-t',
        };
      case 'top':
        return {
          wrapper: 'fixed top-0 left-0 right-0 px-6 py-4',
          align: 'items-center',
          gradient: isDark
            ? 'from-neutral-950/95 via-neutral-950/60 to-transparent'
            : 'from-white/95 via-white/60 to-transparent',
          gradientDir: 'bg-linear-to-b',
        };
      case 'center':
      default:
        return {
          wrapper: 'fixed inset-0 flex items-center justify-center p-4',
          align: 'items-center',
          gradient: '', // без градиента для центра
          gradientDir: '',
        };
    }
  };

  const { wrapper, align, gradient, gradientDir } = getPositionStyles();

  return (
    <div className={cn(
      wrapper,
      gradient && gradientDir,
      gradient && gradient,
      !gradient && (isDark ? 'bg-transparent' : 'bg-transparent'),
      gradient && 'backdrop-blur-md',
      className
    )}>
      <BackgroundBeams theme={isDark ? 'dark' : 'light'} intensity="medium" className='z-0' />
      <div className={cn('w-full flex flex-col', align)}>
        <div className={cn(
          'relative h-1 rounded-full overflow-hidden w-full max-w-xl mx-auto',
          isDark ? 'bg-white/10' : 'bg-black/10'
        )}>
          {/* Основной индикатор */}
          <motion.div
            className={cn(
              'absolute top-0 h-full rounded-full',
              isDark
                ? 'bg-linear-to-r from-blue-500/80 via-blue-400 to-blue-500/80'
                : 'bg-linear-to-r from-blue-500/80 via-blue-600 to-blue-500/80'
            )}
            initial={{ right: '-40%', width: '30%' }}
            animate={{ right: ['100%', '-40%'], width: ['100%', '30%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Свечение */}
          <motion.div
            className={cn(
              'absolute top-0 h-full rounded-full blur-[2px]',
              isDark ? 'bg-blue-400/30' : 'bg-blue-500/30'
            )}
            initial={{ right: '-40%', width: '30%' }}
            animate={{ right: ['100%', '-40%'], width: ['100%', '30%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: -0.2 }}
          />
        </div>

        {/* Текст */}
        {text && (
          <motion.p
            className={cn(
              'text-center font-medium mt-3 tracking-wide mx-auto',
              size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base',
              isDark ? 'text-white/50' : 'text-black/50',
              position === 'center' ? 'max-w-xs' : 'max-w-xl'
            )}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {text}
          </motion.p>
        )}
      </div>
    </div>
  );
};