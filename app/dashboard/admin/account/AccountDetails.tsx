'use client';
import { useRef, useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import UserAvatar from "@/app/components/ui/userAvatar";
import { AccountShort } from "@/types/store.types";
import { useAccountStore } from "@/app/store/accountStore";
import { useUserStore } from "@/app/store/userStore";
import Image from "next/image";
import { useProviderStore } from "@/app/store/providerStore";

export const AccountDetails = () => {
    const { selectedAccount, setSelectedAccount } = useAccountStore();
    const { avatarVersions, user } = useUserStore();
    const { providers } = useProviderStore();

    const activeAccount: AccountShort | null = selectedAccount ?? null;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const linkedUser = useMemo(() =>
        user?.find(u => u._id === activeAccount?.userId),
        [user, activeAccount?.userId]
    );

    const linkedProvider = useMemo(() => {
        const providerIdArray = selectedAccount?.providerId as Array<{ id: string }> | undefined;

        if (!providerIdArray?.length || !providers?.length) return null;

        const providerIds = providerIdArray.map((pid: { id: string }) => String(pid.id));
        return providers.find(p => providerIds.includes(String(p._id))) || null;
    }, [selectedAccount, providers]);

    const avatarSrc = (() => {
        if (!selectedAccount?.avatarUrl) return null;

        const baseVersion = avatarVersions?.[linkedUser?._id || ''] ?? 0;
        if (baseVersion === 0) return selectedAccount.avatarUrl;

        try {
            const url = new URL(selectedAccount.avatarUrl);
            url.searchParams.set('cache', baseVersion.toString());
            return url.toString();
        } catch {
            return selectedAccount.avatarUrl;
        }
    })();

    if (!activeAccount) {
        return <div className="w-full h-90 rounded-3xl border border-transparent" />;
    }

    return (
        <>
            <AnimatePresence mode="wait">
                <motion.div
                    key="details-panel"
                    initial={{ opacity: 0, x: 20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="flex flex-col gap-5 p-6 bg-background border border-foreground/20 backdrop-blur-2xl rounded-3xl shadow-2xl w-full shrink-0 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Details</span>
                        <button onClick={() => setSelectedAccount(null)} className="p-1 rounded-full hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground">✕</button>
                    </div>

                    {/* Avatar & Toggle */}
                    <div className="flex flex-col items-center gap-3">
                        {/* ✅ position: relative для fill-изображения */}
                        <div className="relative w-24 h-24 rounded-full overflow-hidden">
                            {avatarSrc ? (
                                <Image
                                    fill
                                    src={avatarSrc}
                                    alt="Avatar"
                                    sizes="96px"
                                    className="object-cover rounded-full"
                                    unoptimized
                                    priority={false}
                                />
                            ) : (
                                <UserAvatar
                                    size="xl"
                                    name={linkedUser ? (linkedUser.username || `${linkedUser.firstName} ${linkedUser.lastName}`.trim()) : 'Unknown'}
                                    email={linkedUser?.email || ''}
                                    avatarVersion={avatarVersions?.[linkedUser?._id || ''] ?? 0}
                                />
                            )}
                        </div>

                        <div className="text-center">
                            <h3 className="font-bold text-lg truncate">{linkedUser?.username ?? `${linkedUser?.firstName} ${linkedUser?.lastName}`}</h3>
                            <p className="text-xs text-muted-foreground mt-1 truncate">{linkedUser?.email}</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className={`text-xs font-medium ${linkedUser?.isActive ? 'text-emerald-500' : 'text-slate-500'}`}>
                                {linkedUser?.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <button
                                onClick={() => { }}
                                className={`relative w-11 h-6 rounded-full border transition-all duration-300 ${linkedUser?.isActive ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-foreground/5 border-foreground/20'}`}
                            >
                                <motion.span
                                    layout
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    className={`absolute top-0.5 w-5 h-5 rounded-full ${linkedUser?.isActive ? 'bg-emerald-500 left-5' : 'bg-foreground/30 left-0.5'}`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Info Fields */}
                    <div className="space-y-3 pt-2">
                        {[
                            { label: 'Account ID', value: activeAccount._id.toString() },
                            { label: 'User', value: linkedUser ? (linkedUser.username || `${linkedUser.firstName} ${linkedUser.lastName}`.trim()) : 'Unknown' },
                            { label: 'Type', value: activeAccount?.type || 'Unknown' },
                            { label: 'Provider', value: linkedProvider?.displayName || 'Unknown' },
                            { label: 'Created At', value: new Date(activeAccount.createdAt).toLocaleString() },
                            { label: 'Updated At', value: new Date(activeAccount.updatedAt).toLocaleString() },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex items-center justify-between gap-4 py-2.5 border-b border-foreground/5 last:border-0">
                                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider shrink-0">{label}</span>
                                <span className="text-sm text-right truncate font-medium" title={value}>{value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-foreground/10">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-teal-500/20 text-teal-500 text-sm font-medium hover:bg-foreground/5 transition-colors duration-200"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182L7.5 19.213l-4.5 1.125 1.125-4.5L16.862 3.487z" />
                            </svg>
                            Edit
                        </button>
                        <button
                            onClick={() => { }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-500 text-sm font-medium hover:bg-red-500/10 transition-colors duration-200"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Delete
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </>
    );
};