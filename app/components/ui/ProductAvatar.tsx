'use client';
import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fetchAvatar } from '@/app/lib/avatar';
import Image from 'next/image';

const ProductAvatar = ({
  name,
  productId,
  avatarVersion,
  size = 'lg'
}: {
  name: string;
  productId?: string;
  avatarVersion?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}) => {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-base',
    lg: 'w-20 h-20 text-lg',
    xl: 'w-24 h-24 text-xl',
    full: 'w-full h-full text-4xl',
  };

  const sizeMap = {
    sm: { w: 48, h: 48 },
    md: { w: 64, h: 64 },
    lg: { w: 80, h: 80 },
    xl: { w: 96, h: 96 },
    full: { w: 448, h: 224 },
  } as const;

  useEffect(() => {
    if (!productId) {
      return;
    }

    let mounted = true;
    //сброс при смене productId/version, иначе останется старая картинка/скелетон вперемешку 
    setIsLoading(true); //eslint-disable-line 
    const versionParam = avatarVersion ?? 0;

    fetchAvatar(productId, 'product', 'id', versionParam)
      .then(res => {
        if (!mounted) return;

        if (res?.success && res.data) {
          setAvatar(res.data);
        } else {
          setAvatar(null);
        }
      })
      .catch(() => {
        if (mounted) {
          setAvatar(null);
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => { mounted = false; };
  }, [productId, avatarVersion]);

  const { w, h } = sizeMap[size];
  const roundedClass = size === 'full' ? 'rounded-none' : 'rounded-xl';

  return (
    <div className={cn('relative overflow-hidden', roundedClass, sizeClasses[size])}>
      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn('absolute inset-0 bg-foreground/10 animate-pulse', roundedClass)}
          />
        ) : avatar ? (
          <motion.div
            key="image"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0"
          >
            <Image
              src={avatar}
              width={w}
              height={h}
              alt={name}
              className={cn(
                'w-full h-full object-cover border border-border/50',
                roundedClass
              )}
              unoptimized={true}
            />
          </motion.div>
        ) : (
          <motion.div
            key="fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={cn(
              'absolute inset-0 flex items-center justify-center font-semibold border border-border/50',
              'bg-foreground/10 text-foreground',
              roundedClass
            )}
          >
            {name.slice(0, 2).toUpperCase()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(ProductAvatar, (prev, next) => {
  return prev.productId === next.productId &&
    prev.avatarVersion === next.avatarVersion &&
    prev.name === next.name &&
    prev.size === next.size;
});