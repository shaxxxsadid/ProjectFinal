// app/profile/page.tsx
'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSession, signOut, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { BackgroundBeams } from '@/app/components/ui/BackgroundBeams';
import { Loader } from '@/app/components/ui/loader';
import { HorizontalWrapper } from '@/app/components/ui/horizontalWrapper';
import UserAvatar from '@/app/components/ui/userAvatar';
import {
    FaUser, FaEnvelope, FaCalendarAlt, FaShieldAlt,
    FaSignOutAlt, FaCog, FaLock, FaChevronRight, FaCamera,
} from 'react-icons/fa';
import { ChangeUsernameModal } from './ChangeUsernameModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import toast from 'react-hot-toast';
import { useUserStore } from '@/app/store/userStore';
import ProfileAccountsSection from '@/app/components/ui/ProfileAccountsSection';

// 🔷 Типизация ответа API
export interface AccountTypeResponse {
    type: 'oauth' | 'credential';
    provider: {
        _id: string;
        name: 'google' | 'github' | 'yandex' | 'credentials';
    };
}

type ProviderType = 'google' | 'github' | 'yandex';

// Элемент настроек
const SettingsItem = ({
    icon: Icon,
    label,
    value,
    onClick,
    disabled,
}: {
    icon: React.ElementType;
    label: string;
    value?: string;
    onClick?: () => void;
    disabled?: boolean;
}) => (
    <motion.button
        whileHover={onClick && !disabled ? { scale: 1.01 } : undefined}
        whileTap={onClick && !disabled ? { scale: 0.99 } : undefined}
        onClick={onClick}
        disabled={disabled}
        className={cn(
            'w-full grid grid-cols-2 items-center justify-center p-4 rounded-xl',
            'bg-background/30 border border-foreground/10',
            onClick && !disabled && 'hover:bg-background/50 hover:border-foreground/30 hover:cursor-pointer',
            'transition-all duration-200 group',
            disabled && 'opacity-50 cursor-not-allowed'
        )}
    >
        <div className="flex w-full items-center gap-3">
            <div className={cn('p-2 rounded-lg transition-colors', onClick && !disabled && 'group-hover:bg-foreground/5')}>
                <Icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-foreground">{label}: </span>
            {value && <span className="text-xs text-muted-foreground truncate">{value}</span>}
        </div>
        <div className='flex w-full justify-end items-center'>
            {onClick && !disabled && <FaChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />}
        </div>
    </motion.button>
);

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const { uploadAvatar, avatarVersions } = useUserStore();
    const router = useRouter();
    const [isLeaving, setIsLeaving] = useState(false);
    const [canChangePassword, setCanChangePassword] = useState<boolean | null>(null);
    const [connectedProviders, setConnectedProviders] = useState<ProviderType[]>([]);
    const [mounted, setMounted] = useState(false);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkSession = async () => {
            const session = await getSession();
            console.log('[Profile] Session:', session); // 🔍 Смотрим что внутри
            console.log('[Profile] user.id:', session?.user?.id); // Должен быть MongoDB _id
        };
        checkSession();
    }, []);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { setMounted(true); }, []);

    const userSession = useMemo(() => session?.user, [session?.user]);
    const userName = useMemo(() => userSession?.name || 'Пользователь', [userSession?.name]);
    const userEmail = useMemo(() => userSession?.email || '', [userSession?.email]);
    const userRole = useMemo(() => userSession?.role || 'user', [userSession?.role]);

    // 🔷 Функция загрузки данных аккаунтов (по email!)
    const fetchAccountData = useCallback(async () => {
        if (!userEmail) return;
        try {
            // 🔗 API сам найдёт пользователя по email из сессии
            const res = await fetch(`/api/public/user/accounts`);
            if (!res.ok) {
                const errorText = await res.text();
                console.error('[Profile] API error:', res.status, errorText);
                setCanChangePassword(false);
                setConnectedProviders([]);
                return;
            }
            const accounts: AccountTypeResponse[] = await res.json();
            console.log('[Profile] Accounts received:', accounts);

            const hasCredential = accounts.some(acc => acc.type === 'credential');

            // ✅ Фильтр провайдеров
            const oauthProviders = accounts
                .filter(acc => acc.type === 'oauth')
                .map(acc => acc.provider.name.toLowerCase())
                .filter((name): name is ProviderType =>
                    name === 'google' || name === 'github' || name === 'yandex'
                );

            console.log('[Profile] Setting providers:', oauthProviders);
            setCanChangePassword(hasCredential);
            setConnectedProviders(oauthProviders);
        } catch (err) {
            console.error('[Profile] Failed to fetch accounts:', err);
            setCanChangePassword(false);
            setConnectedProviders([]);
        }
    }, [userEmail]);

    // 🔷 Initial fetch
    useEffect(() => {
        if (!mounted || !userEmail) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchAccountData();
    }, [mounted, userEmail, fetchAccountData]);

    // 🔁 Auto-refresh после возврата из OAuth
    useEffect(() => {
        if (!mounted || !userEmail || status !== 'authenticated') return;

        const urlParams = new URLSearchParams(window.location.search);
        const hasOAuthParams = urlParams.has('code') || urlParams.has('error') || urlParams.has('state');

        if (hasOAuthParams) {
            console.log('[Profile] OAuth redirect detected, refetching...');
            const timer = setTimeout(() => {
                router.refresh();
                fetchAccountData();
                if (window.history.replaceState) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [mounted, userEmail, status, router, fetchAccountData]);

    // 🔷 Ранние возвраты
    if (!mounted || status === 'loading') {
        return <div className="min-h-screen bg-background flex items-center justify-center"><Loader text="Загрузка профиля..." position="center" /></div>;
    }
    if (status === 'unauthenticated') {
        router.push('/pages/login');
        return null;
    }

    // 🔷 Handlers
    const handleSignOut = async () => { setIsLeaving(true); await signOut({ callbackUrl: '/pages/login' }); };

    const handleUsernameChange = async ({ firstname, lastname }: { firstname: string; lastname: string }) => {
        try {
            const res = await fetch('/api/public/user/username', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, newUsername: `${lastname} ${firstname}`.trim() }),
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Ошибка обновления' };
            return { success: true };
        } catch { return { success: false, error: 'Ошибка соединения' }; }
    };

    const handlePasswordChange = async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
        try {
            const res = await fetch('/api/public/user/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, currentPassword, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Ошибка сервера' };
            return { success: true };
        } catch { return { success: false, error: 'Ошибка соединения' }; }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                await uploadAvatar(undefined, file);
                toast.success('Аватар обновлён');
            } catch (err) { toast.error(err instanceof Error ? err.message : 'Ошибка загрузки аватара'); }
        };
        reader.onerror = () => toast.error('Не удалось прочитать файл');
    };

    const roleColors: Record<string, string> = { admin: 'bg-red-500 text-white', manager: 'bg-blue-500 text-white', user: 'bg-blue-500/50 text-white' };
    const roleLabels: Record<string, string> = { admin: 'Админ', manager: 'Менеджер', user: 'Пользователь' };

    return (
        <div className="relative min-h-screen bg-background overflow-hidden">
            <BackgroundBeams intensity="low" className="opacity-50" />
            <motion.div className="absolute inset-0 pointer-events-none" animate={{ background: ['radial-gradient(ellipse at top, rgba(59,130,246,0.05) 0%, transparent 50%)', 'radial-gradient(ellipse at bottom, rgba(139,92,246,0.05) 0%, transparent 50%)', 'radial-gradient(ellipse at top, rgba(59,130,246,0.05) 0%, transparent 50%)'] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />

            <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Профиль</h1>
                    <p className="text-muted-foreground mt-1">Управление аккаунтом и настройками</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className={cn('relative p-6 md:p-8 rounded-3xl border backdrop-blur-md', 'bg-linear-to-br from-box/20 to-box/5 border-border/50', 'shadow-2xl shadow-black/5')}>
                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="absolute inset-0 rounded-full bg-linear-to-r from-primary/50 to-purple-500/50 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                            <UserAvatar name={userName} email={userEmail} size="xl" avatarVersion={avatarVersions?.[userEmail]} />
                            <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center backdrop-blur-[2px]">
                                <FaCamera className="text-white w-5 h-5 mb-1" /><span className="text-[10px] font-bold uppercase text-white">Change</span>
                            </motion.div>
                            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                        </motion.div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left">
                            <motion.h2 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="text-2xl font-bold text-foreground">{userName}</motion.h2>
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 mt-1"><FaEnvelope className="w-4 h-4" />{userEmail}</motion.p>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><FaCalendarAlt className="w-3.5 h-3.5" />Аккаунт активен</div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><FaShieldAlt className="w-3.5 h-3.5" />Защищённое соединение</div>
                            </motion.div>
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.35, type: "spring", stiffness: 200 }} className="mt-3 flex justify-center md:justify-start">
                                <span className={cn('px-3 py-1 rounded-full text-xs font-medium', roleColors[userRole] || roleColors.user)}>{roleLabels[userRole]}</span>
                            </motion.div>
                        </div>

                        {/* Logout */}
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSignOut} disabled={isLeaving} className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium', 'bg-red-500/10 text-red-400 border border-red-500/20', 'hover:bg-red-500/20 hover:border-red-500/40', 'transition-all duration-200 disabled:opacity-50')}>
                            {isLeaving ? <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : <FaSignOutAlt className="w-4 h-4" />}Выйти
                        </motion.button>
                    </div>

                    <div className="mt-6 w-1/2"><HorizontalWrapper expand height={1} className="opacity-30 mb-5 w-full max-w-full" /></div>



                    {/* Settings */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }} className="mt-6 mb-6 max-w-full">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><FaCog className="w-4 h-4 text-primary" />Настройки аккаунта</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <SettingsItem icon={FaEnvelope} label="Email" value={userEmail} disabled />
                            <SettingsItem icon={FaUser} label="Имя пользователя" value={userName} onClick={() => setShowUsernameModal(true)} />
                            <SettingsItem icon={FaLock} label="Сменить пароль" value="••••••••" onClick={() => { if (canChangePassword === false) { toast.error('Смена пароля недоступна для аккаунтов OAuth'); return; } setShowPasswordModal(true); }} disabled={canChangePassword === false || canChangePassword === null} />
                        </div>
                    </motion.div>
                    {/* Connected Providers */}
                    <ProfileAccountsSection />
                </motion.div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showUsernameModal && <ChangeUsernameModal isOpen={showUsernameModal} onClose={() => setShowUsernameModal(false)} initialUsername={userName} onSubmit={handleUsernameChange} />}
                {showPasswordModal && <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} userEmail={userEmail} onSubmit={handlePasswordChange} />}
            </AnimatePresence>

            {/* Loading Overlay */}
            <AnimatePresence>{isLeaving && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"><Loader text="Выход из системы..." position="center" /></motion.div>}</AnimatePresence>
        </div>
    );
}