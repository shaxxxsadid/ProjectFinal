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
import { signOut, useSession } from "next-auth/react";
import UserAvatar from "./userAvatar";
import { useUserStore } from "@/app/store/userStore";

const NAV_ITEM_BASE = [
    "relative flex justify-start items-center w-full gap-6",
    "cursor-pointer overflow-hidden",
    "border-l-[3px] border-l-transparent",
    "py-6 rounded-r-lg",   // было px-2 py-2
    "transition-all duration-150 ease-in-out",
    "group",
].join(" ");

const NAV_ITEM_HOVER = [
    "hover:border-l-black dark:hover:border-l-white",
    "hover:bg-black/10 dark:hover:bg-white/10",
    "hover:pl-6",
].join(" ");

interface NavItemProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

function NavItem({ children, onClick, className = "" }: NavItemProps) {
    return (
        <li
            className={`${NAV_ITEM_BASE} ${NAV_ITEM_HOVER} ${className}`}
            onClick={onClick}
        >
            {/* скользящий фоновый блик */}
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 translate-x-full group-hover:translate-x-0
                           bg-linear-to-r from-white/5 to-transparent
                           transition-transform duration-500 ease-in-out"
            />
            {/* нижняя линия раскрывается слева */}
            <span
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-4 right-4 h-px bg-foreground/20
                           scale-x-0 group-hover:scale-x-100 origin-left
                           transition-transform duration-350 ease-in-out"
            />
            {children}
        </li>
    );
}

export default function Header() {
    const socialLinkClass =
        "flex justify-center items-center dark:text-white text-black mx-2 w-12 h-12 hover:scale-125 transition-defaultTransition";
    const [expand, setExpand] = useState(false);
    const baseClass =
        "fixed flex flex-col justify-between top-0 bottom-0 " +
        "bg-white dark:bg-black " +
        "border-r-2 border-black/20 dark:border-white/30 " +
        "p-4 defaultTransitionEaseInOut";
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const { data: session, status } = useSession();
    const { avatarVersions } = useUserStore();
    const socials = {
        github: {
            link: "https://github.com/shaxxxsadid",
            svg: <FaGithub className={socialLinkClass} />,
            alt: "GitHub",
        },
        telegram: {
            link: "https://t.me/shaxxxsadid",
            svg: <FaTelegramPlane className={socialLinkClass} />,
            alt: "Telegram",
        },
        email: {
            link: "mailto:alexandrdobrynin2003@gmail.com",
            svg: <FaRegEnvelope className={socialLinkClass} />,
            alt: "Email",
        },
    };

    /* общие пропсы для иконок кнопок */
    const iconBtn = (base: { darkIcon: string; lightIcon: string }) => ({
        img: { ...base, width: 40, height: 40 },
        className:
            "flex items-center text-center gap-6 text-2xl justify-around " +
            "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] " +
            "group-hover:scale-110 group-hover:-rotate-[4deg] " +
            "group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.35)]",
    });

    /* общие пропсы для TXT-лейблов */
    const labelTxt = {
        className:
            "dark:text-white text-black text-2xl text-center " +
            "group-hover:tracking-wide",
        variants: textAnimations.typing,
        initial: "initial" as const,
        style: { whiteSpace: "nowrap" as const },
        animate: expand ? "animate" : "initial",
        transition: { delay: 0.15 },
    };

    return (
        <header
            className={`${baseClass} ${expand ? "w-64" : "w-20"} z-10 overflow-hidden whitespace-nowrap`}
            onMouseEnter={() => setExpand(true)}
            onMouseLeave={() => setExpand(false)}
        >
            {/* логотип */}
            <div className="flex justify-start gap-6 ml-1 items-center w-64">
                <ThemedIcon
                    darkIcon={Images.light.menu.src}
                    lightIcon={Images.dark.menu.src}
                    width={40}
                    height={40}
                    alt="Menu"
                    className={`${expand ? "rotate-90" : "rotate-0"} w-8.75 h-8.75 flex justify-center defaultTransitionEaseInOut`}
                />
                <TXT
                    className="dark:text-white text-black text-2xl"
                    variants={textAnimations.fadeIn}
                    initial="initial"
                    animate={expand ? "animate" : "initial"}
                    transition={{ delay: 0.3 }}
                >
                    Warehouse
                </TXT>
            </div>

            {/* навигация */}
            <nav className="flex flex-col justify-center items-center defaultTransitionEaseInOut h-full w-54">
                <ul className={`dark:text-white text-black flex flex-col items-start justify-center gap-8 h-1/2`}>
                    {/* Главная */}
                    <NavItem onClick={() => router.push("/")}>
                        <Button
                            {...iconBtn({
                                darkIcon: Images.light.home.src,
                                lightIcon: Images.dark.home.src,
                            })}
                            onClick={() => router.push("/")}
                        />
                        <TXT {...labelTxt} animate={expand ? "animate" : { opacity: 0, x: -10 }}>
                            Главная
                        </TXT>
                    </NavItem>

                    {/* Каталог */}
                    <NavItem onClick={() => router.push("/pages/catalog")}>
                        <Button
                            {...iconBtn({
                                darkIcon: Images.dark.catalog.src,
                                lightIcon: Images.light.catalog.src,
                            })}
                            onClick={() => router.push("/catalog")}
                        />
                        <TXT {...labelTxt} animate={expand ? "animate" : { opacity: 0, x: -10 }}>
                            Каталог
                        </TXT>
                    </NavItem>

                    {/* Админ */}
                    <NavItem onClick={() => router.push("/dashboard/admin")}>
                        <Button
                            {...iconBtn({
                                darkIcon: Images.dark.admin.src,
                                lightIcon: Images.light.admin.src,
                            })}
                            onClick={() => router.push("/dashboard/admin")}
                        />
                        <TXT {...labelTxt} animate={expand ? "animate" : { opacity: 0, x: -10 }}>
                            Админ
                        </TXT>
                    </NavItem>

                    {/* Профиль */}
                    <NavItem onClick={() => router.push("/pages/profile")}>
                        {status === "unauthenticated" ?
                            <Button
                                {...iconBtn({
                                    darkIcon: Images.dark.userPlaceholder.src,
                                    lightIcon: Images.light.userPlaceholder.src,
                                })}
                                onClick={() => router.push("/login")}
                            />
                            :
                            // ✅ Приоритет: БД → Провайдер → Инициалы
                            <UserAvatar 
                                name={session?.user?.name || "user"} 
                                email={session?.user?.email as string} 
                                size="sm" 
                                avatarVersion={avatarVersions?.[session?.user?.email as string]}
                                fallbackImage={session?.user?.image} // Провайдер как fallback
                            />
                        }

                        <TXT {...labelTxt} animate={expand ? "animate" : { opacity: 0, x: -10 }}>
                            Профиль
                        </TXT>
                    </NavItem>

                    {/* ThemeToggle */}
                    <li className="flex w-full justify-center items-center">
                        <HorizontalWrapper className="w-2/3 flex justify-center items-center" expand={expand} theme={resolvedTheme as "light" | "dark"} />
                    </li>

                    {/* Контакты */}
                    <li className="flex justify-center w-54 items-center gap-6">
                        <TXT
                            className="dark:text-white text-black text-2xl text-center"
                            variants={textAnimations.typing}
                            initial="initial"
                            style={{ whiteSpace: "nowrap" }}
                            animate={expand ? "animate" : "initial"}
                            transition={{ delay: 0.3 }}
                        >
                            Контакты
                        </TXT>
                    </li>

                    {/* Иконки соцсетей */}
                    <li
                        className={`flex ${expand ? "opacity-100" : "opacity-0"} defaultTransitionEaseInOut`}
                    >
                        {Object.values(socials).map(
                            (social: { link: string; svg: React.ReactNode; alt: string }, index) => (
                                <Link
                                    key={index}
                                    href={social.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={socialLinkClass}
                                >
                                    {social.svg}
                                </Link>
                            )
                        )}
                    </li>
                </ul>
            </nav>

            {/* footer хедера */}
            <div className="w-54 flex justify-between items-center">
                <div className="flex justify-end defaultTransitionEaseInOut">
                    <Button
                        img={{
                            darkIcon: Images.dark.logIn.src,
                            lightIcon: Images.light.logIn.src,
                            width: 45,
                            height: 45,
                        }}
                        onClick={() => {
                            if (session) signOut()
                            else router.push("/pages/login");
                        }}
                        ariaLabel="Войти"
                        className="rounded-full defaultTransitionCubicBezier hover:cursor-pointer"
                    />
                </div>
                <div
                    className={`${expand ? "opacity-100" : "opacity-0"} flex w-35 justify-end defaultTransitionEaseInOut`}
                >
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}