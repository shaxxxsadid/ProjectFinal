// app/components/ui/horizontalWrapper.tsx
'use client';

import { useEffect, useState } from 'react';

interface Props {
    width?: number | string;
    height?: number | string;
    color?: string;
    theme?: "light" | "dark";
    className?: string;
    expand?: boolean;
}

export function HorizontalWrapper({
    width = 200,
    height = 2,
    className = "",
    expand = false,
}: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);//eslint-disable-line
    }, []);

    const normalizedHeight = typeof height === "number" ? `${height}px` : height;
    const normalizedWidth = typeof width === "number" ? `${width}px` : width;

    // Только рендерим с аниматором после гидратации
    const shouldAnimate = mounted ? expand : false;

    return (
        <div
            className={`flex items-center justify-center ${className}`}
            style={{ width: normalizedWidth, minWidth: 0, maxWidth: normalizedWidth }}
        >
            <div
                suppressHydrationWarning
                className="bg-foreground"
                style={{
                    height: normalizedHeight,
                    width: "100%",
                    opacity: shouldAnimate ? 1 : 0,
                    transform: `scaleX(${shouldAnimate ? 1 : 0})`,
                    transformOrigin: "center",
                    transition: "transform 0.3s ease, opacity 0.3s ease",
                }}
            />
        </div>
    );
}