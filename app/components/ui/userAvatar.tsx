'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';
import { fetchAvatar } from '@/app/lib/avatar';
import Image from 'next/image';
import { Images } from "@/public/images"
import { useTheme } from 'next-themes';

const subscribe = () => () => { };

const UserAvatar = ({
  name,
  email,
  size = 'lg',
  avatarVersion,
  fallbackImage
}: {
  name: string;
  email?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  avatarVersion?: number;
  fallbackImage?: string;
}) => {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-11 h-11 text-sm',
    md: 'w-16 h-16 text-base',
    lg: 'w-20 h-20 text-lg',
    xl: 'w-24 h-24 text-xl'
  };

  const sizeValues = {
    sm: 44,
    md: 64,
    lg: 80,
    xl: 96
  };

  const { theme } = useTheme();
  const resolvedTheme = (theme === 'light' || theme === 'dark') ? theme : 'light';
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    if (!email) return;

    let mounted = true;
    fetchAvatar(email, 'user', 'email', avatarVersion).then(res => {
      if (mounted) {
        if (res.success && res.data) {
          setAvatar(res.data);
          setImageError(false);
        } else {
          setAvatar(null);
        }
      }
    });

    return () => { mounted = false; };
  }, [email, avatarVersion]);

  const handleError = () => {
    setImageError(true);
  };

  const sizeClass = sizeClasses[size];
  const sizeValue = sizeValues[size];

  // Если есть аватар из БД - используем Image
  if (avatar && !imageError) {
    return (
      <div className={cn('relative rounded-full overflow-hidden', sizeClass)}>
        <Image
          src={avatar}
          alt={name}
          fill
          sizes={`${sizeValue}px`}
          className="rounded-full object-cover shrink-0"
          onError={handleError}
        />
      </div>
    );
  }

  // Fallback image от провайдера
  if (fallbackImage && !imageError) {
    return (
      <div className={cn('relative rounded-full overflow-hidden', sizeClass)}>
        <Image
          src={fallbackImage}
          alt={name}
          fill
          sizes={`${sizeValue}px`}
          className="object-cover object-center"
          onError={handleError}
        />
      </div>
    );
  }

  // Заглушка с инициалами
  if (!mounted || imageError) {
    return (
      <div className={cn(
        'rounded-full flex items-center justify-center font-semibold border border-border/50',
        'text-foreground/80 bg-foreground/10',
        sizeClass
      )}>
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  // Дефолтное изображение
  return (
    <div className={cn('relative rounded-full overflow-hidden', sizeClass)}>
      <Image
        src={Images[resolvedTheme === 'dark' ? 'dark' : 'light'].userPlaceholder}
        alt={name}
        fill
        sizes={`${sizeValue}px`}
        className="object-cover object-center"
      />
    </div>
  );
};

export default UserAvatar;