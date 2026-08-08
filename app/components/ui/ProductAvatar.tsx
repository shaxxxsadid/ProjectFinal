'use client';
import { useEffect, useState, memo } from 'react';
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
    const versionParam = avatarVersion ?? 0; // ✅ Всегда передаем число, даже 0

    console.log('Fetching avatar for productId:', productId, 'with avatarVersion:', versionParam);

    fetchAvatar(productId, 'product', 'id', versionParam)
      .then(res => {
        if (!mounted) return;

        console.log('✅ Avatar API response:', res);

        // Если success: true и data есть — всё ок
        if (res?.success && res.data) {
          setAvatar(res.data);
        } else {
          // Если success: true но data нет — это нормально, показываем fallback
          console.log('⚠️ Avatar not found for this version, using default');
          setAvatar(null);
        }
      })
      .catch(err => {
        if (mounted) {
          console.error('❌ Failed to fetch avatar:', err);
          setAvatar(null);
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => { mounted = false; };
  }, [productId, avatarVersion]);

  if (isLoading) {
    return <div className={cn('bg-gray-200 animate-pulse', sizeClasses[size], 'rounded-xl')} />;
  }
  if (avatar) {
    console.log('Rendering avatar for productId:', productId, 'with avatarVersion:', avatarVersion || 'none');
    const { w, h } = sizeMap[size];
    return (
      <Image
        src={avatar}
        width={w}
        height={h}
        alt={name}
        className={cn(
          'object-cover border border-border/50',
          size === 'full' ? 'rounded-none' : 'rounded-xl',
          sizeClasses[size]
        )}
        unoptimized={true}
      />
    );
  }

  return (
    <div className={cn(
      'flex items-center justify-center font-semibold border border-border/50',
      size === 'full' ? 'rounded-none' : 'rounded-xl',
      sizeClasses[size],
      'text-white'
    )}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
};

export default memo(ProductAvatar, (prev, next) => {
  return prev.productId === next.productId &&
    prev.avatarVersion === next.avatarVersion &&
    prev.name === next.name &&
    prev.size === next.size;
});