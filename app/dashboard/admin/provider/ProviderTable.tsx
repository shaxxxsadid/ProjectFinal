'use client';
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pagination } from "@/app/components/ui/pagination";
import UserAvatar from "@/app/components/ui/userAvatar";
import { ProviderShort } from "@/types/store.types";
import { useProviderStore } from "@/app/store/providerStore";
import { PROVIDER_META } from "@/app/components/providerMeta";

const ITEMS_PER_PAGE = 6;

export const ProviderTable = ({ searchQuery = '' }: { searchQuery?: string }) => {
    const { providers, setSelectedProvider, selectedProvider } = useProviderStore();
    const activeProvider: ProviderShort | null = selectedProvider ?? null;
    const [currentPage, setCurrentPage] = useState(1);

    const filteredProviders = useMemo(() => {
        if (!providers) return [];
        if (!searchQuery.trim()) return providers;
        const q = searchQuery.toLowerCase();
        return providers.filter((provider) => provider.displayName.toLowerCase().includes(q) || provider.publicId.toLowerCase().includes(q));
    }, [providers, searchQuery]);

    const totalPages = useMemo(
        () => Math.ceil((filteredProviders.length || 0) / ITEMS_PER_PAGE),
        [filteredProviders]
    );

    const safePage = Math.min(currentPage, Math.max(1, totalPages));

    const currentProviders = useMemo(() => {
        if (!filteredProviders) return [];
        const start = (safePage - 1) * ITEMS_PER_PAGE;
        return filteredProviders.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredProviders, safePage]);

    return (
        <div className="w-full justify-between flex flex-col min-h-104">
            <div className="flex flex-col">
                <AnimatePresence mode="popLayout">
                    {currentProviders.map((provider) => {
                        const meta = PROVIDER_META[provider.publicId];
                        const isActive = activeProvider?._id === provider._id;
                        const isConnected = provider.isActive;

                        return (
                            <motion.div
                                key={provider._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => setSelectedProvider(provider)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer border transition-all duration-200 ${isActive
                                    ? 'bg-foreground/10 border-foreground/20'
                                    : 'border-transparent hover:bg-foreground/5 hover:border-foreground/10'
                                    }`}
                            >
                                {/* Иконка провайдера */}
                                {meta ? (
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${meta.color}`}>
                                        <meta.icon size={16} />
                                    </div>
                                ) : (
                                    <UserAvatar name={provider.displayName} size="sm" />
                                )}

                                {/* Имя и тип */}
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="font-medium truncate">{provider.displayName}</span>
                                    <span className="text-[11px] font-semibold tracking-widest uppercase text-foreground/35 truncate">
                                        {meta?.label ?? provider.publicId}
                                    </span>
                                </div>

                                {/* Статус подключения */}
                                <div className={`shrink-0 flex items-center gap-1.5 text-sm font-medium ${isConnected ? 'text-emerald-400' : 'text-foreground/30'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-foreground/20'
                                        }`} />
                                    {isConnected ? 'Connected' : 'Not connected'}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center pt-4 border-t border-foreground/10">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
};