'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Meteors } from '@/app/components/ui/meteors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        const normalizedEmail = email.trim().toLowerCase();
        if (!firstName.trim() || !lastName.trim()) {
            setError('Укажите имя и фамилию');
            return;
        }
        if (!EMAIL_PATTERN.test(normalizedEmail)) {
            setError('Укажите корректный email');
            return;
        }
        if (password.length < 8) {
            setError('Пароль должен содержать не менее 8 символов');
            return;
        }
        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email: normalizedEmail, password, confirmPassword }),
            });
            const result: { error?: string } = await response.json();
            if (!response.ok) {
                setError(result.error || 'Не удалось завершить регистрацию');
                return;
            }

            const signInResult = await signIn('credentials', {
                email: normalizedEmail,
                password,
                callbackUrl: '/pages/catalog',
                redirect: false,
            });
            if (!signInResult?.ok || signInResult.error) {
                setError('Аккаунт создан. Войдите через страницу авторизации.');
                return;
            }
            window.location.href = signInResult.url || '/pages/catalog';
        } catch {
            setError('Ошибка соединения. Попробуйте ещё раз.');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClassName = 'w-full rounded-xl bg-background/75 px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:bg-background focus:ring-2 focus:ring-box/50 disabled:opacity-50';

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-background via-muted/30 to-box/10 px-4 py-12 text-foreground">
            <Meteors className="pointer-events-none" />
            <div className="relative z-10 w-full max-w-md rounded-2xl bg-linear-to-br from-box/15 to-box/5 p-8 shadow-2xl shadow-black/10 backdrop-blur-xl dark:shadow-black/30">
                <h1 className="text-3xl font-bold">Регистрация</h1>
                <p className="mt-2 text-sm text-muted-foreground">Создайте аккаунт для работы с каталогом.</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="firstName" className="mb-2 block text-sm font-medium">Имя</label>
                        <input id="firstName" name="firstName" autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} disabled={isLoading} required className={inputClassName} />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="mb-2 block text-sm font-medium">Фамилия</label>
                        <input id="lastName" name="lastName" autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} disabled={isLoading} required className={inputClassName} />
                    </div>
                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-medium">Email</label>
                        <input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isLoading} required className={inputClassName} />
                    </div>
                    <div>
                        <label htmlFor="password" className="mb-2 block text-sm font-medium">Пароль</label>
                        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} disabled={isLoading} required className={inputClassName} />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium">Повтор пароля</label>
                        <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={isLoading} required className={inputClassName} />
                    </div>

                    {error && <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p>}

                    <button type="submit" disabled={isLoading} className="w-full rounded-xl bg-box px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:text-black">
                        {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Уже есть аккаунт?{' '}
                    <Link href="/pages/login" className="font-medium text-box hover:underline">Войти</Link>
                </p>
            </div>
        </main>
    );
}
