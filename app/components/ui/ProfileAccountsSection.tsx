'use client';

import { useEffect, useState, useCallback } from 'react';
import { FaGithubAlt, FaGoogle, FaYandexInternational } from 'react-icons/fa6';
import { toast } from 'react-hot-toast';
import { useSearchParams, useRouter } from 'next/navigation';

interface LinkedAccount {
    type: 'oauth' | 'credential';
    provider: {
        _id: string;
        name: 'google' | 'github' | 'yandex' | 'credentials';
    };
}

type Provider = 'google' | 'github' | 'yandex';

const PROVIDERS: { id: Provider; label: string; Icon: React.ElementType }[] = [
    { id: 'google',  label: 'Google', Icon: FaGoogle },
    { id: 'github',  label: 'GitHub', Icon: FaGithubAlt },
    { id: 'yandex',  label: 'Яндекс', Icon: FaYandexInternational },
];

const ERROR_MESSAGES: Record<string, string> = {
    oauth_cancelled:      'Авторизация отменена',
    missing_params:       'Некорректный ответ от провайдера',
    invalid_state:        'Сессия устарела, попробуйте ещё раз',
    state_expired:        'Сессия истекла, попробуйте ещё раз',
    unknown_provider:     'Неизвестный провайдер',
    token_exchange_failed:'Не удалось получить токен от провайдера',
    no_email:             'Провайдер не вернул email',
    email_taken:          'Этот email уже используется другим аккаунтом',
    account_taken:        'Этот аккаунт уже привязан к другому пользователю',
    provider_not_found:   'Провайдер не найден в системе',
    server_error:         'Внутренняя ошибка сервера',
};

export default function ProfileAccountsSection() {
    const [accounts, setAccounts]       = useState<LinkedAccount[]>([]);
    const [loading, setLoading]         = useState(true);
    const [linking, setLinking]         = useState<Provider | null>(null);
    const [unlinking, setUnlinking]     = useState<Provider | null>(null);

    const searchParams = useSearchParams();
    const router       = useRouter();

    useEffect(() => {
        const linkSuccess = searchParams.get('link_success');
        const linkError   = searchParams.get('link_error');

        if (linkSuccess) {
            toast.success(`${linkSuccess} успешно привязан`);
            // Чистим URL без перезагрузки
            router.replace(window.location.pathname, { scroll: false });
        } else if (linkError) {
            toast.error(ERROR_MESSAGES[linkError] ?? 'Ошибка привязки аккаунта');
            router.replace(window.location.pathname, { scroll: false });
        }
    }, [searchParams, router]);

    const fetchAccounts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/public/user/accounts');
            if (!res.ok) throw new Error('Failed to fetch');
            setAccounts(await res.json());
        } catch {
            toast.error('Не удалось загрузить список аккаунтов');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

    const handleLink = async (provider: Provider) => {
        setLinking(provider);
        try {
            const res = await fetch(`/api/public/user/accounts/link?provider=${provider}`);
            const data = await res.json();

            if (!res.ok || !data.url) {
                toast.error(data.error ?? 'Не удалось начать привязку');
                return;
            }

            // Полный редирект — браузер уйдёт к провайдеру и вернётся с ?link_success=...
            window.location.href = data.url;
        } catch {
            toast.error('Ошибка соединения');
            setLinking(null);
        }
        // setLinking(null) не нужен — страница уйдёт
    };

    const handleUnlink = async (provider: Provider) => {
        setUnlinking(provider);
        try {
            const res = await fetch(`/api/public/user/accounts/unlink?provider=${provider}`, {
                method: 'DELETE',
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error ?? 'Не удалось отвязать аккаунт');
                return;
            }

            toast.success(`${provider} отвязан`);
            setAccounts((prev) => prev.filter((a) => a.provider.name !== provider));
        } catch {
            toast.error('Ошибка соединения');
        } finally {
            setUnlinking(null);
        }
    };

    const isLinked = (provider: Provider) =>
        accounts.some((a) => a.provider.name === provider);

    const hasCredentials = accounts.some((a) => a.provider.name === 'credentials');

    // ─── UI ───────────────────────────────────────────────────────────────────

    return (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">
                Привязанные аккаунты
            </h2>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-3">

                    {/* OAuth провайдеры */}
                    {PROVIDERS.map(({ id, label, Icon }) => {
                        const linked      = isLinked(id);
                        const isLinking   = linking === id;
                        const isUnlinking = unlinking === id;
                        const busy        = !!linking || !!unlinking;

                        // Не даём отвязать последний способ входа
                        const canUnlink = linked && (
                            accounts.filter((a) => a.provider.name !== id).length > 0 || hasCredentials
                        );

                        return (
                            <div
                                key={id}
                                className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-700/30 bg-slate-900/30"
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm text-slate-300">{label}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {linked && (
                                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">
                                            Привязан
                                        </span>
                                    )}

                                    {linked ? (
                                        <button
                                            onClick={() => handleUnlink(id)}
                                            disabled={busy || !canUnlink}
                                            title={!canUnlink ? 'Нельзя отвязать единственный способ входа' : undefined}
                                            className="flex hover:cursor-pointer items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                                text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent
                                                hover:border-red-500/25 transition-all duration-200
                                                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-400
                                                disabled:hover:bg-transparent disabled:hover:border-transparent"
                                        >
                                            {isUnlinking ? (
                                                <div className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
                                            ) : (
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                        d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                            Отвязать
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleLink(id)}
                                            disabled={busy}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                                text-blue-400 hover:text-white hover:bg-blue-500/20 border border-blue-500/25
                                                hover:border-blue-500/50 transition-all duration-200
                                                disabled:opacity-40 disabled:cursor-not-allowed hover:cursor-pointer"
                                        >
                                            {isLinking ? (
                                                <div className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
                                            ) : (
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                        d="M12 4v16m8-8H4" />
                                                </svg>
                                            )}
                                            Привязать
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}