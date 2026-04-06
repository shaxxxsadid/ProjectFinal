// app/components/ui/theme-Icon.tsx
'use client';

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemedIcon {
    darkIcon: string;
    lightIcon: string;
    alt?: string;
    width?: number;
    height?: number;
    className?: string;
}

export default function ThemedIcon(props: ThemedIcon) {
    const { resolvedTheme } = useTheme();
    const [isMounted, setIsMounted] = useState(false);
    
    // Ждём, пока компонент смонтируется на клиенте
    useEffect(() => {
        setIsMounted(true);// eslint-disable-line
    }, []);

    const { darkIcon, lightIcon, alt, width, height, className } = props;
    
    // Пока не смонтировано — рендерим светлую версию (или заглушку)
    // Это должно совпадать с тем, что рендерит сервер
    const iconSrc = isMounted && resolvedTheme === "dark" ? darkIcon : lightIcon;

    return (
        <img // eslint-disable-line
            src={iconSrc}
            alt={alt ?? ''}
            width={width ?? 10}
            height={height ?? 10}
            className={className}
            // Важно: добавляем suppressHydrationWarning, если стиль зависит от темы
            suppressHydrationWarning
        />
    );
}