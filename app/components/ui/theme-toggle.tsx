'use client';

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Button from "./button";
import { buttonPresets } from "@/app/lib/motion-presets";
import { Images } from "@/public/images";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);// eslint-disable-line react-hooks/set-state-in-effect
    }, []);

    // Пока компонент не смонтирован, ничего не показываем
    if (!mounted) {
        return null;
    }

    return <Button
        img={{
            lightIcon: Images.light.sun.src,
            darkIcon: Images.dark.moon.src,
            width: 40,
            height: 40
        }}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        ariaLabel="Сменить тему"
        className="dark:bg-white bg-black text-white p-2 rounded-full w-12.5 h-12.5 aspect-square defaultTransitionCubicBezier hover:cursor-pointer"
        {...buttonPresets.themeToggle}
    />

}