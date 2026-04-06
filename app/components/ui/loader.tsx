'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { BackgroundBeams } from './BackgroundBeams';

export interface LoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Loader = ({ text = 'Загрузка...', size = 'md', className }: LoaderProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(saved as 'light' | 'dark');//eslint-disable-line
  }, []);

  const sizeConfig = {
    sm: { spinner: 'h-8 w-8', text: 'text-sm', gap: 'gap-2' },
    md: { spinner: 'h-12 w-12', text: 'text-base', gap: 'gap-3' },
    lg: { spinner: 'h-16 w-16', text: 'text-lg', gap: 'gap-4' },
  };

  const { spinner, text: textSize, gap } = sizeConfig[size];
  const isDark = theme === 'dark';

  return (
    <div className={cn(
      'relative min-h-[250px] flex flex-col items-center justify-center overflow-hidden rounded-2xl',
      isDark ? 'bg-neutral-950/40' : 'bg-white/40',
      'backdrop-blur-md border',
      isDark ? 'border-white/10' : 'border-black/10',
      className
    )}>
      <BackgroundBeams theme={theme} intensity="low" className="opacity-60" />
      
      <div className={cn('relative z-10 flex flex-col items-center', gap)}>
        {/* Animated gradient spinner */}
        <motion.div
          className={cn(
            'relative rounded-full p-0.5',
            spinner,
            isDark 
              ? 'bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500' 
              : 'bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400'
          )}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        >
          <div className={cn(
            'w-full h-full rounded-full',
            isDark ? 'bg-neutral-950' : 'bg-white'
          )} />
        </motion.div>

        {text && (
          <motion.p
            className={cn(
              'font-medium tracking-tight',
              textSize,
              isDark ? 'text-white/80' : 'text-black/70'
            )}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {text}
          </motion.p>
        )}
      </div>
    </div>
  );
};