'use client';

import { motion } from "motion/react";
import { HTMLMotionProps } from "motion/react";
import { useTheme } from "next-themes";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    onClick?: () => void
    img?: {
        lightIcon: string;
        darkIcon: string;
        width: number;
        height: number;
        whileHover?: Record<string, any>; //eslint-disable-line
        whileTap?: Record<string, any>; //eslint-disable-line
        animate?: Record<string, any>; //eslint-disable-line
        transition?: Record<string, any>; //eslint-disable-line
    };
    className?: string;
    textOnBtn?: string;
    type?: 'submit' | 'reset' | 'button';
    ariaLabel?: string;
}

export default function Button(props: ButtonProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const { onClick, img, className, textOnBtn, type, ariaLabel, ...restMotionProps } = props;
    return (
        <motion.button
            className={className ? className : 'bg-slate-500 text-white rounded defaultTransitionCubicBezier'}
            onClick={onClick}
            type={type ? type : 'button'}
            aria-label={ariaLabel ? ariaLabel : ''}
            {...restMotionProps}
        >
            {img ?
                <motion.img
                    src={isDark ? img.darkIcon : img.lightIcon}
                    alt="img"
                    width={img.width}
                    height={img.height}
                    whileHover={img.whileHover}
                    whileTap={img.whileTap}
                    animate={img.animate}
                    transition={img.transition}
                /> : ''
            }
            {textOnBtn}

        </motion.button>
    );
}