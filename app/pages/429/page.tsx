// app/pages/429/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { BackgroundBeams } from '@/app/components/ui/BackgroundBeams';
import { Loader } from '@/app/components/ui/loader';
import { FaExclamationTriangle, FaClock, FaHome, FaRedo } from 'react-icons/fa';

export default function TooManyRequestsPage() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(30);
  const [canRetry, setCanRetry] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Получаем время из query-параметров (?retry=45)
    const params = new URLSearchParams(window.location.search);
    const retry = parseInt(params.get('retry') || '30', 10);
    const safeRetry = Math.max(5, Math.min(120, retry)); // защита от неадекватных значений
    setSeconds(safeRetry);

    const timer = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanRetry(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Плавный градиент для иконки
  const iconGradient = useMemo(() => 
    canRetry 
      ? 'from-emerald-400 to-teal-500' 
      : 'from-amber-400 to-orange-500'
  , [canRetry]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader text="Загрузка..." position="center" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Фоновые эффекты как в профиле */}
      <BackgroundBeams intensity="low" className="opacity-40" />
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{ 
          background: [
            'radial-gradient(ellipse at top, rgba(239,68,68,0.08) 0%, transparent 50%)',
            'radial-gradient(ellipse at bottom, rgba(249,115,22,0.08) 0%, transparent 50%)',
            'radial-gradient(ellipse at top, rgba(239,68,68,0.08) 0%, transparent 50%)',
          ] 
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          className={cn(
            'relative w-full p-8 md:p-10 rounded-3xl border backdrop-blur-md',
            'bg-linear-to-br from-box/15 to-box/5 border-border/50',
            'shadow-2xl shadow-black/10 dark:shadow-black/30'
          )}
        >
          {/* Иконка с градиентом */}
          <motion.div 
            className="relative mx-auto w-20 h-20 mb-6"
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          >
            <div className={cn(
              'absolute inset-0 rounded-2xl bg-linear-to-r blur-xl opacity-60',
              iconGradient
            )} />
            <div className={cn(
              'relative w-full h-full rounded-2xl flex items-center justify-center',
              'bg-linear-to-r text-white',
              iconGradient
            )}>
              {canRetry ? (
                <FaRedo className="w-8 h-8" />
              ) : (
                <FaExclamationTriangle className="w-8 h-8" />
              )}
            </div>
          </motion.div>

          {/* Заголовок */}
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl md:text-3xl font-bold text-foreground text-center tracking-tight"
          >
            {canRetry ? 'Можно продолжить' : 'Слишком много запросов'}
          </motion.h1>

          {/* Описание */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-center mt-3 leading-relaxed"
          >
            {canRetry 
              ? 'Лимит запросов сброшен. Вы можете обновить страницу или вернуться на главную.' 
              : 'Вы превысили допустимое количество запросов. Пожалуйста, подождите немного, чтобы система восстановилась.'
            }
          </motion.p>

          {/* Таймер / Статус */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className={cn(
              'flex items-center justify-center gap-2 mt-6 p-4 rounded-xl',
              'bg-muted/30 border border-border/50'
            )}
          >
            <FaClock className={cn(
              'w-4 h-4 flex-shrink-0',
              canRetry ? 'text-emerald-500' : 'text-amber-500'
            )} />
            <span className={cn(
              'font-mono font-semibold',
              canRetry ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
            )}>
              {canRetry ? 'Готово' : `Повторите через ${seconds} сек.`}
            </span>
          </motion.div>

          {/* Кнопки действий */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 mt-8"
          >

            {/* Кнопка "Обновить" — активна только после таймера */}
            <motion.button
              whileHover={canRetry ? { scale: 1.02 } : undefined}
              whileTap={canRetry ? { scale: 0.98 } : undefined}
              onClick={() => canRetry && router.push('/')}
              disabled={!canRetry}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-200',
                canRetry
                  ? 'bg-linear-to-r from-primary to-purple-600 text-primary-foreground hover:opacity-90 cursor-pointer'
                  : 'bg-muted/30 text-muted-foreground border border-border/30 cursor-not-allowed'
              )}
            >
              <FaRedo className={cn(
                'w-4 h-4',
                canRetry && 'animate-spin-slow'
              )} />
              {canRetry ? 'На главную' : 'Подождите...'}
            </motion.button>
          </motion.div>

          {/* Декоративная линия */}
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-8 h-px bg-linear-to-r from-transparent via-border/50 to-transparent"
          />

          {/* Подсказка для разработчиков (только в dev) */}
          {process.env.NODE_ENV === 'development' && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-xs text-muted-foreground/60 text-center mt-4 font-mono"
            >
              Rate limit: 60 req/min • Reset: {new Date(Date.now() + seconds * 1000).toLocaleTimeString()}
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
}