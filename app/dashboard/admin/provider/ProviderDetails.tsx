'use client';
import { useState } from "react";
import { toast } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import UserAvatar from "@/app/components/ui/userAvatar";
import { ProviderShort } from "@/types/store.types";
import { useProviderStore } from "@/app/store/providerStore";
import { PROVIDER_META } from "@/app/components/providerMeta";
import { CrudProviderModal } from "@/app/components/ui/admin/modal/ProviderCrudModal";

export const ProviderDetails = () => {
    const { selectedProvider, setSelectedProvider, deleteProvider, toggleActiveProvider, updateProvider } = useProviderStore();
    const activeProvider: ProviderShort | null = selectedProvider ?? null;
    const [isModalOpen, setIsModalOpen] = useState(false);
    if (!activeProvider) {
        return <div className="w-full h-90 rounded-3xl border border-transparent" />;
    }

    const meta = PROVIDER_META[activeProvider.publicId];

    return (
        <>
            <AnimatePresence mode="popLayout">
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
                        <button onClick={() => setSelectedProvider(null)} className="p-1 rounded-full hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground">✕</button>
                    </div>

                    {/* Avatar & Toggle */}
                    <div className="flex flex-col items-center gap-3">
                        {/* ✅ position: relative для fill-изображения */}
                        <div className="relative w-24 h-24 rounded-full overflow-hidden">
                            {meta ? (
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center border shrink-0 ${meta.color}`}>
                                    <meta.icon size={36} />
                                </div>
                            ) : (
                                <UserAvatar name={activeProvider.displayName} size="xl" />
                            )}
                        </div>
                        {/*  */}
                        <div className="text-center">
                            <h3 className="font-bold text-lg truncate">{activeProvider.displayName}</h3>
                            <p className="text-xs text-muted-foreground mt-1 truncate">{activeProvider.publicId}</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className={`text-xs font-medium ${activeProvider?.isActive ? 'text-emerald-500' : 'text-slate-500'}`}>
                                {activeProvider?.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <button
                                onClick={() => { }}
                                className={`relative w-11 h-6 rounded-full border transition-all duration-300 ${activeProvider?.isActive ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-foreground/5 border-foreground/20'}`}
                            >
                                <motion.span
                                    layout
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    onClick={() => {
                                        toast.promise(
                                            toggleActiveProvider(activeProvider._id, !activeProvider.isActive),
                                            {
                                                loading: 'Updating provider...',
                                                success: 'Provider updated successfully!',
                                                error: 'Failed to update provider',
                                            }
                                        )
                                    }}
                                    className={`absolute cursor-pointer top-px w-5 h-5 rounded-full ${activeProvider?.isActive ? 'bg-emerald-500 left-5' : 'bg-foreground/30 left-0.5'}`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Info Fields */}
                    <div className="space-y-3 pt-2">
                        {[
                            { label: 'Provider ID', value: activeProvider._id.toString() },
                            { label: 'Provider Name', value: activeProvider.displayName || 'Unknown' },
                            { label: 'Public ID', value: activeProvider?.publicId || 'Unknown' },
                            { label: 'Created At', value: new Date(activeProvider.createdAt).toLocaleString() },
                            { label: 'Updated At', value: new Date(activeProvider.updatedAt).toLocaleString() },
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
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete this provider?')) {
                                    toast.promise(deleteProvider(activeProvider._id), {
                                        loading: 'Deleting provider...',
                                        success: 'Provider deleted successfully!',
                                        error: 'Failed to delete provider',
                                    })
                                }
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-500 text-sm font-medium hover:bg-red-500/10 transition-colors duration-200"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Delete
                        </button>
                    </div>
                </motion.div>
                <CrudProviderModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={async (data) => {
                        const result = await updateProvider(
                            activeProvider._id,
                            data as Omit<ProviderShort, '_id' | 'createdAt' | 'updatedAt'>
                        );

                        if (result?.success) {
                            toast.success('Provider updated successfully!');
                            setIsModalOpen(false);
                        } else {
                            toast.error(result?.error || 'Failed to update provider');
                        }

                        return result ?? { success: false, error: 'Unknown error' };
                    }}
                    mode="edit"
                    initialValues={activeProvider}
                />
            </AnimatePresence>
        </>
    );
};