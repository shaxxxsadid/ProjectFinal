'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';
import { fetchAvatar } from '@/app/lib/avatar';
import Image from 'next/image';
import { Images } from "@/public/images"
import { useTheme } from 'next-themes';
const subscribe = () => () => {};

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
  fallbackImage?: string; // ✅ Аватар от провайдера как fallback
}) => {
  const [avatar, setAvatar] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-11 h-11 text-sm ',
    md: 'w-16 h-16 text-base',
    lg: 'w-20 h-20 text-lg',
    xl: 'w-24 h-24 text-xl'
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
      if (mounted) setAvatar(res.success && res.data ? res.data : null);
    });

    return () => { mounted = false; };
  }, [email, avatarVersion]);

  // Если есть аватар из БД - показываем его
  if (avatar) {
    return (
      <img// eslint-disable-line
        src={avatar}
        alt={name}
        className={cn('rounded-full object-cover aspect-square', sizeClasses[size])}
        onError={e => {
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  }

  if (fallbackImage) {
    return (
      <img // eslint-disable-line
        src={fallbackImage}
        alt={name}
        className={cn('rounded-full', sizeClasses[size])}
        onError={e => {
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  }

  if (!mounted) {
    return (
      <div className={cn(
        'rounded-full flex items-center justify-center font-semibold border border-border/50',
        'text-foreground/80 bg-foreground/10',
        sizeClasses[size]
      )}>
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div className={cn('rounded-full flex items-center justify-center text-foreground', sizeClasses[size])}>
      <Image
        src={Images[resolvedTheme === 'dark' ? 'dark' : 'light'].userPlaceholder}
        alt={name}
        className={cn('rounded-full', sizeClasses[size])}
      />
    </div>
  );
};

export default UserAvatar;