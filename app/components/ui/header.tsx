'use client';
import { useState } from "react";
import ThemeToggle from "./theme-toggle";
import { Images } from "@/public/images";
import ThemedIcon from "./theme-Icon";
import TXT from "./txt";
import { textAnimations } from "@/app/lib/motion-presets";
import Button from "./button";
import { useRouter } from 'next/navigation'
import { HorizontalWrapper } from "./horizontalWrapper";
import { useTheme } from "next-themes";
import { FaRegEnvelope, FaTelegramPlane } from "react-icons/fa";
import Link from "next/link";
import { FaGithub } from "react-icons/fa6";

export default function Header() {
    const socialLinkClass: string = "flex justify-center items-center dark:text-white text-black mx-2 w-12 h-12 hover:text-black-500 hover:scale-125 transition-defaultTransition";
    const [expand, setExpand] = useState(false);
    const baseClass = 'fixed flex flex-col justify-between top-0 bottom-0 dark:bg-black bg-white border-r-2 dark:border-white/30 border-black text-white p-4 defaultTransitionEaseInOut';
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const socials: object = {
        github: {
            link: "https://github.com/shaxxxsadid",
            svg: <FaGithub className={socialLinkClass} />,
            alt: 'GitHub'
        },
        telegram: {
            link: "https://t.me/shaxxxsadid",
            svg: <FaTelegramPlane className={socialLinkClass} />,
            alt: 'Telegram'
        },
        email: {
            link: "mailto:alexandrdobrynin2003@gmail.com",
            svg: <FaRegEnvelope className={socialLinkClass} />,
            alt: 'Email'
        },
        // Vk: {
        //     link: "https://vk.com/shaxxxsadid",
        //     svg: <FaVk className={socialLinkClass} />,
        //     alt: 'VK'
        // }
    }
    return (
        <header
            className={`${baseClass} ${expand ? 'w-64' : 'w-20'} overflow-hidden whitespace-nowrap`}
            onMouseEnter={() => setExpand(true)}
            onMouseLeave={() => setExpand(false)}
        >
            <div className="flex justify-start gap-6 ml-1 items-center w-64">
                <ThemedIcon
                    darkIcon={Images.light.menu.src}
                    lightIcon={Images.dark.menu.src}
                    width={40}
                    height={40}
                    alt="Menu"
                    className={`${expand ? 'rotate-90' : 'rotate-0'} w-8.75 h-8.75 flex justify-center defaultTransitionEaseInOut`}
                />
                <TXT className={`
                    dark:text-white
                     text-black 
                     text-2xl
                     
                     `}
                    variants={textAnimations.fadeIn}
                    initial="initial"
                    animate={expand ? "animate" : "initial"}
                    transition={{ delay: 0.3 }}>
                    Warehouse
                </TXT>
            </div>
            <nav className={`flex flex-col justify-center items-center defaultTransitionEaseInOut h-full w-54`}>
                <ul className={`${expand ? '' : 'text-transparent'} dark:text-white text-black flex flex-col items-start justify-center gap-8 h-1/2`}>
                    <li
                        className="flex justify-center items-center gap-6 hover:cursor-pointer"
                        onClick={() => router.push('/')}
                    >
                        <Button
                            img={{
                                darkIcon: Images.light.home.src,
                                lightIcon: Images.dark.home.src,
                                width: 40,
                                height: 40
                            }}
                            className="flex items-center text-center gap-6 text-2xl justify-around hover:cursor-pointer"
                            onClick={() => router.push('/')}
                        />
                        <TXT className={`dark:text-white
                        text-black 
                        text-2xl
                        text-center
                        `}
                            variants={textAnimations.typing}
                            initial="initial"
                            style={{ whiteSpace: "nowrap" }}
                            animate={expand ? "animate" : "initial"}
                            transition={{ delay: 0.3 }}>
                            Главная
                        </TXT>
                    </li>
                    <li
                        className="flex justify-center items-center gap-6 hover:cursor-pointer"
                        onClick={() => router.push('/catalog')}
                    >
                        <Button
                            img={{
                                darkIcon: Images.dark.catalog.src,
                                lightIcon: Images.light.catalog.src,
                                width: 40,
                                height: 40
                            }}
                            className="flex items-center text-center gap-6 text-2xl justify-around hover:cursor-pointer"
                            onClick={() => router.push('/catalog')}
                        />
                        <TXT className={`dark:text-white
                        text-black 
                        text-2xl
                        text-center
                        `}
                            variants={textAnimations.typing}
                            initial="initial"
                            style={{ whiteSpace: "nowrap" }}
                            animate={expand ? "animate" : "initial"}
                            transition={{ delay: 0.3 }}>
                            Каталог
                        </TXT>
                    </li>
                    <li className="flex justify-center items-center gap-6">
                        <Button
                            img={{
                                darkIcon: Images.dark.panel.src,
                                lightIcon: Images.light.panel.src,
                                width: 40,
                                height: 40
                            }}
                            className="flex items-center text-center gap-6 text-2xl justify-around"
                        />
                        <TXT className={`dark:text-white
                        text-black 
                        text-2xl
                        text-center
                        `}
                            variants={textAnimations.typing}
                            initial="initial"
                            style={{ whiteSpace: "nowrap" }}
                            animate={expand ? "animate" : "initial"}
                            transition={{ delay: 0.3 }}>
                            Админ
                        </TXT>
                    </li>
                    <li className="flex justify-center items-center gap-6">
                        <Button
                            img={{
                                darkIcon: Images.dark.userPlaceholder.src,
                                lightIcon: Images.light.userPlaceholder.src,
                                width: 40,
                                height: 40
                            }}
                            className="flex items-center text-center gap-6 text-2xl justify-around"
                        />
                        <TXT className={`dark:text-white
                        text-black 
                        text-2xl
                        text-center
                        `}
                            variants={textAnimations.typing}
                            initial="initial"
                            style={{ whiteSpace: "nowrap" }}
                            animate={expand ? "animate" : "initial"}
                            transition={{ delay: 0.3 }}>
                            Профиль
                        </TXT>
                    </li>
                    <li className="flex justify-center items-center">
                        <HorizontalWrapper
                            width={216}
                            theme={isDark ? "dark" : "light"}
                            initial={{ scaleX: 0 }}
                            animate={expand ? { scaleX: 1 } : { scaleX: 0 }}
                            transition={{ delay: 0.3 }}
                        />
                    </li>
                    <li className="flex justify-center w-54 items-center gap-6">
                        <TXT className={`dark:text-white
                        text-black 
                        text-2xl
                        text-center
                        `}
                            variants={textAnimations.typing}
                            initial="initial"
                            style={{ whiteSpace: "nowrap" }}
                            animate={expand ? "animate" : "initial"}
                            transition={{ delay: 0.3 }}>
                            Контакты
                        </TXT>
                    </li>
                    <li className={`flex ${expand ? 'opacity-100' : 'opacity-0'} defaultTransitionEaseInOut `}>
                        {Object.values(socials).map((social: { link: string; svg: string; alt: string }, index) => (
                            <Link
                                key={index}
                                href={social.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={socialLinkClass}
                            >
                                {social.svg}
                            </Link>
                        ))}
                    </li>
                </ul>
            </nav>
            <div className="w-54 flex justify-between items-center">
                <div className={`flex justify-end defaultTransitionEaseInOut`}>
                    <Button
                        img={{
                            darkIcon: Images.dark.logIn.src,
                            lightIcon: Images.light.logIn.src,
                            width: 45,
                            height: 45,
                            whileHover: { x: -5 },
                            transition: { type: "spring", stiffness: 400 }
                        }}
                        onClick={() => router.push('/login')}
                        ariaLabel="Войти"
                        className="rounded-full defaultTransitionCubicBezier hover:cursor-pointer"
                    />
                </div>
                <div className={`${expand ? 'opacity-100' : 'opacity-0'} flex w-35 justify-end defaultTransitionEaseInOut`}>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
} 