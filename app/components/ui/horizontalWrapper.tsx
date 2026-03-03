"use client";

import { motion, MotionProps } from "motion/react";

interface Props extends MotionProps {
    width?: number;
    height?: number | string;
    color?: string;          // Ручной цвет (приоритет)
    theme?: "light" | "dark"; // Авто-цвет по теме
    className?: string;
}

export function HorizontalWrapper({ 
    width = 200, 
    height = 2,
    color,                // Без дефолта, чтобы проверить наличие
    theme = "light",      // По умолчанию светлая
    className = "",
    // Motion props
    initial = { scaleX: 0 },
    animate = { scaleX: 1 },
    transition = { duration: 0.5, ease: "easeInOut" },
    ...restMotionProps
}: Props) {
    // ✅ Логика цвета: ручной цвет > тема
    const lineColor = color || (theme === "dark" ? "#fff" : "#000");

    return (
        <div className={`flex items-center justify-center ${className}`} style={{ width }}>
            {/* Левая линия */}
            <motion.div
                initial={initial}
                animate={animate}
                transition={transition}
                style={{ 
                    backgroundColor: lineColor, 
                    height,
                    flex: 1,
                    transformOrigin: "right",
                }}
                {...restMotionProps}
            />

            {/* Правая линия */}
            <motion.div
                initial={initial}
                animate={animate}
                transition={transition}
                style={{ 
                    backgroundColor: lineColor, 
                    height,
                    flex: 1,
                    transformOrigin: "left",
                }}
                {...restMotionProps}
            />
        </div>
    );
}