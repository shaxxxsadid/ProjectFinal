'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';
import { fetchAvatar } from '@/app/lib/avatar';
import Image from 'next/image';
import { Images } from "@/public/images"
import { useTheme } from 'next-themes';

// Функция-заглушка для подписки на изменения состояния (клиент/сервер)
const subscribe = () => () => {};

/**
 * Хук, который проверяет, выполняется ли компонент на клиенте.
 * На сервере вернёт false, на клиенте — true.
 */
export const useIsClient = () => {
  // useSyncExternalStore вызывает этот хук всегда на клиенте без лишних рендеров
  return useSyncExternalStore(subscribe, () => true, () => false);
};

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

  // Проверяем, выполняемся ли мы на клиенте
  const isClient = useIsClient();

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

  const { resolvedTheme } = useTheme();

  // Эффект выполняется только на клиенте и только если есть email
  useEffect(() => {
    if (!isClient || !email) return;
    
    fetchAvatar(email, 'user', 'email', avatarVersion).then(res => {
      if (res.success && res.data) {
        setAvatar(res.data);
        setImageError(false);
      } else {
        setAvatar(null);
      }
    });
  }, [isClient, email, avatarVersion]);

  // Если на сервере — просто рендерим заглушку
  if (!isClient) return null;

  const handleError = () => {
    setImageError(true);
  };

  const sizeClass = sizeClasses[size];
  const sizeValue = sizeValues[size];

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

  return (
    <div className={cn('relative rounded-full overflow-hidden bg-muted', sizeClass)}>
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