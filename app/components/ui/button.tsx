// app/components/ui/button.tsx
'use client';

import { motion } from "motion/react";
import { HTMLMotionProps } from "motion/react";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    onClick?: () => void;
    img?: {
        lightIcon: string;
        darkIcon: string;
        width: number;
        height: number;
    };
    className?: string;
    textOnBtn?: string;
    type?: 'submit' | 'reset' | 'button';
    ariaLabel?: string;
}

export default function Button(props: ButtonProps) {
    const { onClick, img, className, textOnBtn, type, ariaLabel, ...restMotionProps } = props;
    
    return (
        <motion.button
            className={className ?? 'bg-slate-500 text-white rounded defaultTransitionCubicBezier'}
            onClick={onClick}
            type={type ?? 'button'}
            aria-label={ariaLabel ?? ''}
            {...restMotionProps}
        >
            {img ? (
                <span className="relative inline-block" style={{ width: img.width, height: img.height }}>
                    {/* 🌞 Светлая иконка — видна по умолчанию */}
                    <img
                        src={img.lightIcon}
                        alt="img"
                        width={img.width}
                        height={img.height}
                        className="block dark:hidden"
                        suppressHydrationWarning
                    />
                    {/* 🌙 Тёмная иконка — видна только при классе .dark на <html> */}
                    <img
                        src={img.darkIcon}
                        alt="img"
                        width={img.width}
                        height={img.height}
                        className="hidden dark:block"
                        suppressHydrationWarning
                    />
                </span>
            ) : null}
            {textOnBtn}
        </motion.button>
    );
}