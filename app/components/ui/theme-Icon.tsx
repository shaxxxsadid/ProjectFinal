'use client';

import { useTheme } from "next-themes";
import Image from "next/image";

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
    const isDark = resolvedTheme === "dark";
    const { darkIcon, lightIcon, alt, width, height, className } = props;
    return <Image
        src={isDark ? darkIcon : lightIcon} 
        alt={alt ? alt : ''} 
        width={width ? width : 10} 
        height={height ? height : 10} 
        className={className}/>;
}