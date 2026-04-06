'use client';

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { buttonPresets } from "@/app/lib/motion-presets";
import { Images } from "@/public/images";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <motion.button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Сменить тему"
            className="dark:bg-white bg-black p-2 rounded-full w-12 h-12 defaultTransitionCubicBezier hover:cursor-pointer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            {...buttonPresets.themeToggle}
        >
            <img
                src={Images.light.sun.src}
                alt="light"
                width={28}
                height={28}
                className="block dark:hidden"
            />
            <img
                src={Images.dark.moon.src}
                alt="dark"
                width={28}
                height={28}
                className="hidden dark:block"
            />
        </motion.button>
    );
}