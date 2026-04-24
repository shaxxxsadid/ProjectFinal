'use client';

import { useEffect, useState } from 'react';
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
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) => {
  const [avatar, setAvatar] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-base',
    lg: 'w-20 h-20 text-lg',
    xl: 'w-24 h-24 text-xl'
  };

  const sizeMap = {
    sm: { w: 48, h: 48 },
    md: { w: 64, h: 64 },
    lg: { w: 80, h: 80 },
    xl: { w: 96, h: 96 }
  } as const;

  useEffect(() => {
    if (!productId) return;
    let mounted = true;

    fetchAvatar(productId, 'product', 'id', avatarVersion).then(res => {
      if (mounted) setAvatar(res.success && res.data ? res.data : null);
    });

    return () => { mounted = false; };
  }, [productId, avatarVersion]);

  if (avatar) {
    const { w, h } = sizeMap[size];
    return (
      <Image
        src={avatar}
        width={w}
        height={h}
        alt={name}
        className={cn('rounded-xl object-cover border border-border/50', sizeClasses[size])}
        onError={e => {
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  }

  return (
    <div className={cn(
      'rounded-xl flex items-center justify-center font-semibold border border-border/50',
      sizeClasses[size],
      'text-white'
    )}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
};

export default ProductAvatar;