'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { fetchAvatar } from '@/app/lib/avatar';

const UserAvatar = ({
  name,
  email,
  size = 'lg'
}: {
  name: string;
  email?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) => {
  const [avatar, setAvatar] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-11 h-11 text-sm',
    md: 'w-16 h-16 text-base',
    lg: 'w-20 h-20 text-lg',
    xl: 'w-24 h-24 text-xl'
  };

  useEffect(() => {
    if (!email) return;

    let mounted = true;
    fetchAvatar(email, 'user', 'email').then(res => {
      if (mounted) setAvatar(res.success && res.data ? res.data : null);
    });

    return () => { mounted = false; };
  }, [email]);

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

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-semibold border border-border/50',
      sizeClasses[size],
      'text-white'
    )}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
};

export default UserAvatar;