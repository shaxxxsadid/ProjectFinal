'use client';

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Meteors } from "@/app/components/ui/meteors";
import { signIn } from "next-auth/react"
import { FaGithubAlt, FaGoogle, FaYandexInternational } from "react-icons/fa6";
import { toast } from "react-hot-toast";
import { useDebounce } from "@/app/hooks/debounce";
export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const debouncedEmail = useDebounce(email, 1000);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await signIn('credentials', {
            email,
            password,
            callbackUrl: '/',
            redirect: false,
        });

        setIsLoading(false);

        if (result?.error) {
            console.error('Login failed:', result.error);
            toast.error('Неверный логин или пароль');

        } else {
            window.location.href = '/';
            toast.success('Успешная авторизация');
        }
    };


    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    useEffect(() => {
        if (debouncedEmail && !isValidEmail(debouncedEmail)) {
            toast.error('Неверный формат электронной почты');
        }
        if (debouncedEmail && isValidEmail(debouncedEmail)) {
            toast.dismiss();
        }
    }, [debouncedEmail]);

    const providerItems = {
        google: {
            name: 'Google',
            icon: <FaGoogle />,
            onClick: () => signIn('google')
        },
        github: {
            name: 'Github',
            icon: <FaGithubAlt />,
            onClick: () => signIn('github')
        },
        yandex: {
            name: 'Yandex',
            icon: <FaYandexInternational />,
            onClick: () => signIn('yandex')
        },
    }
    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">

            {/* 🌠 Meteors Background */}
            <Meteors className="absolute inset-0 z-0 bg-background" />

            {/* 📦 Login Card */}
            <div className="relative z-10 w-full max-w-md px-4">

                {/* Header */}
                <div className="mb-8 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-2">
                        WAREHOUSE / AUTH
                    </p>
                    <h1 className="text-4xl font-bold text-foreground tracking-tight">
                        Sign In
                    </h1>
                </div>

                {/* Card */}
                <div className={cn(
                    "w-full p-8 rounded-2xl border shadow-2xl backdrop-blur-md",
                    "bg-box/10 ",
                    "transition-all duration-300"
                )}>
                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Email
                        </label>
                        <div className="relative group">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={cn(
                                    "w-full px-4 py-3.5 rounded-xl text-sm font-mono",
                                    "bg-background/50 border border-input",
                                    "text-foreground placeholder-muted-foreground",
                                    "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary)]",
                                    "transition-all duration-200"
                                )}
                                placeholder="admin@warehouse.com"
                                autoComplete="email"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground)]">
                            Password
                        </label>
                        <div className="relative group">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={cn(
                                    "w-full px-4 pr-12 py-3.5 rounded-xl text-sm font-mono",
                                    "bg-background/50 border border-input]",
                                    "text-foreground placeholder-muted-foreground",
                                    "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary",
                                    "transition-all duration-200"
                                )}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        disabled={isLoading}
                        className={cn(
                            "w-full py-3.5 px-4 rounded-xl font-semibold text-sm uppercase tracking-wider",
                            "bg-primary/10 text-primary-foreground)",
                            "border border-foreground/10 hover:opacity-90 mt-6",
                            "focus:outline-none focus:ring-2 focus:ring-(--ring)/30",
                            "active:scale-[0.98] transition-all duration-200",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "relative overflow-hidden group hover:cursor-pointer"
                        )}
                        onClick={handleSubmit}
                    >
                        <span className={cn("flex items-center justify-center gap-2", isLoading && "opacity-0")}>
                            Sign In
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-primary-foreground)/30 border-t-primary-foreground) rounded-full animate-spin" />
                            </div>
                        )}
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/10 to-transparent" />
                    </button>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-foreground/10 z-0" />
                        </div>
                        <div className="relative flex justify-center text-sm z-10">
                            <span className="px-3 bg-box/80 rounded-2xl text-white/80">
                                or continue with
                            </span>
                        </div>
                    </div>

                    {/* Social Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                        {["Google", "GitHub", "Yandex"].map((provider) => {
                            const providerKey = provider.toLowerCase();
                            const icon = providerItems[providerKey as keyof typeof providerItems]?.icon;

                            return (
                                <div
                                    key={provider}
                                    className={cn(
                                        "flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border",
                                        "bg-background/50 text-muted-foreground",
                                        "hover:text-foreground hover:bg-background/80 hover:border-primary",
                                        "transition-colors duration-200 cursor-pointer"
                                    )}
                                    onClick={() => signIn(providerKey, { callbackUrl: "/" })}
                                >
                                    {icon && <span className="shrink-0">{icon}</span>}
                                    <span className="font-medium text-sm">
                                        {provider === "Yandex" ? "Яндекс" : provider}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div >
    );
}