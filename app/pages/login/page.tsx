// app/pages/login/page.tsx
'use client';

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { FaGithubAlt, FaGoogle, FaYandexInternational } from "react-icons/fa6";
import { toast } from "react-hot-toast";
import { useDebounce } from "@/app/hooks/debounce";
import { Meteors } from "@/app/components/ui/meteors";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    const debouncedEmail = useDebounce(email, 1000);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    useEffect(() => {
        if (debouncedEmail && !isValidEmail(debouncedEmail)) {
            toast.error('Неверный формат электронной почты', { id: 'email-validation' });
        } else if (debouncedEmail) {
            toast.dismiss('email-validation');
        }
    }, [debouncedEmail]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                callbackUrl: '/',
                redirect: false,
            });

            if (result?.error) {
                toast.error('Неверный логин или пароль');
            } else {
                toast.success('Успешная авторизация');
                window.location.href = result?.url || '/';
            }
        } catch (err) {
            toast.error('Ошибка соединения');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuthSignIn = async (provider: 'google' | 'github' | 'yandex') => {
        setOauthLoading(provider);
        try {
            await signIn(provider, { callbackUrl: '/' });
        } catch (err) {
            toast.error(`Не удалось подключиться к ${provider === 'yandex' ? 'Яндексу' : provider}`);
            setOauthLoading(null);
        }
    };

    if (!mounted) return null;

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Background */}
            <Meteors className="bg-background text-foreground"/>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md px-4">
                <div className="mb-8 text-center animate-fade-in">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                        WAREHOUSE / AUTH
                    </p>
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                        Sign In
                    </h1>
                </div>

                <div className="w-full p-8 rounded-2xl border border-slate-700/50 shadow-2xl backdrop-blur-xl bg-slate-800/50">
                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl text-sm bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 disabled:opacity-50"
                            placeholder="admin@warehouse.com"
                            autoComplete="email"
                            disabled={isLoading || !!oauthLoading}
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-2 mt-4">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 pr-12 py-3 rounded-xl text-sm bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 disabled:opacity-50"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                disabled={isLoading || !!oauthLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-white transition-colors"
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
                        disabled={isLoading || !!oauthLoading}
                        onClick={handleSubmit}
                        className="w-full mt-6 py-3 px-4 rounded-xl font-semibold text-sm uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white border border-blue-500/50 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                    >
                        <span className={`flex items-center justify-center gap-2 transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                            Sign In
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </button>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-600/50" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-slate-800/80 rounded-lg text-slate-400">
                                or continue with
                            </span>
                        </div>
                    </div>

                    {/* Social Buttons */}
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => handleOAuthSignIn('google')}
                            disabled={isLoading || !!oauthLoading}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-600/50 bg-slate-700/30 text-slate-300 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                        >
                            {oauthLoading === 'google' ? (
                                <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                            ) : (
                                <>
                                    <FaGoogle className="w-4 h-4" />
                                    <span className="font-medium text-sm">Google</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => handleOAuthSignIn('github')}
                            disabled={isLoading || !!oauthLoading}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-600/50 bg-slate-700/30 text-slate-300 hover:bg-slate-600/50 hover:border-slate-500 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                        >
                            {oauthLoading === 'github' ? (
                                <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                            ) : (
                                <>
                                    <FaGithubAlt className="w-4 h-4" />
                                    <span className="font-medium text-sm">GitHub</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => handleOAuthSignIn('yandex')}
                            disabled={isLoading || !!oauthLoading}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-600/50 bg-slate-700/30 text-slate-300 hover:bg-red-600/10 hover:border-red-600/50 hover:text-red-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                        >
                            {oauthLoading === 'yandex' ? (
                                <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                            ) : (
                                <>
                                    <FaYandexInternational className="w-4 h-4" />
                                    <span className="font-medium text-sm">Яндекс</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-500 mt-6">
                    By signing in, you agree to our{' '}
                    <a href="/terms" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                        Terms of Service
                    </a>
                </p>
            </div>
        </div>
    );
}