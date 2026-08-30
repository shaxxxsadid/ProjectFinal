'use client';
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CategoryShort } from "@/types/store.types";
import { useCategoryStore } from "@/app/store/categoryStore";
import toast from "react-hot-toast";
import { CrudCategoryModal } from "@/app/components/ui/admin/modal/CategoryCrudModal";

export const CategoryDetails = () => {
    const { selectedCategory, setSelectedCategory, deleteCategory, updateCategory } = useCategoryStore();
    const activeCategory: CategoryShort | null = selectedCategory ?? null;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const getParentLabel = (parent: CategoryShort['parent']) => {
        if (!parent) return '—';

        if (typeof parent === 'string') {
            return parent;
        }

        if (typeof parent === 'object') {
            const p = parent as { _id?: string; name?: string; code?: string };

            if (p.name && p.code) {
                return `${p.name} (${p.code})`;
            }

            if (p.name) {
                return p.name;
            }

            if (p.code) {
                return p.code;
            }

            if (p._id) {
                return p._id;
            }
        }

        return '—';
    };

    if (!activeCategory) {
        return <div className="w-full h-90 rounded-3xl border border-transparent" />;
    }

    return (
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
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className="p-1 rounded-full hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
                    >✕</button>
                </div>

                {/* Icon + Name */}
                <div className="flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-foreground/5 flex items-center justify-center">
                        <span className="text-3xl font-bold text-foreground/40 uppercase">
                            {activeCategory.name?.slice(0, 2) || '??'}
                        </span>
                    </div>

                    <div className="text-center">
                        <h3 className="font-bold text-lg leading-tight">{activeCategory.name}</h3>
                        <span className="font-mono px-2.5 py-1 rounded-lg text-xs tracking-wide border bg-foreground/5 border-foreground/10 text-foreground/50 mt-1 inline-block">
                            {activeCategory.code}
                        </span>
                    </div>

                    {/* Бейджи */}
                    <div className="flex gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${activeCategory.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${activeCategory.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {activeCategory.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border bg-teal-500/10 text-teal-400 border-teal-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                            Level {activeCategory.level}
                        </span>
                    </div>
                </div>

                {/* Info Fields */}
                <div className="space-y-1 pt-2">
                    {[
                        { label: 'Category ID', value: activeCategory._id.toString() },
                        { label: 'Parent', value: getParentLabel(activeCategory.parent) },
                        { label: 'Description', value: activeCategory.description || '—' },
                        {
                            label: 'Attributes',
                            value: activeCategory.attributes?.length
                                ? `${activeCategory.attributes.length} attribute(s)`
                                : '—',
                        },
                        {
                            label: 'Created At',
                            value: activeCategory.createdAt
                                ? new Date(activeCategory.createdAt).toLocaleString()
                                : '—',
                        },
                        {
                            label: 'Updated At',
                            value: activeCategory.updatedAt
                                ? new Date(activeCategory.updatedAt).toLocaleString()
                                : '—',
                        },
                    ].map(({ label, value }) => (
                        <div
                            key={label}
                            className="flex items-center justify-between gap-4 py-2.5 border-b border-foreground/5 last:border-0"
                        >
                            <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider shrink-0">
                                {label}
                            </span>
                            <span
                                className="text-sm text-right truncate font-medium text-foreground/80"
                                title={value}
                            >
                                {value}
                            </span>
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
                            toast.promise(deleteCategory(activeCategory._id), {
                                loading: 'Deleting category...',
                                success: 'Category deleted successfully.',
                                error: 'Failed to delete category.',
                            });
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
            <CrudCategoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialValues={activeCategory}
                mode="edit"
                onSubmit={async (data) => {
                    if (!activeCategory?._id) {
                        return { success: false, error: 'Category ID is missing' };
                    }

                    try {
                        const res = await updateCategory(
                            activeCategory._id,
                            data
                        );

                        if (!res.success) {
                            throw new Error(res.error || 'Failed to update category');
                        }

                        toast.success('Category updated successfully');
                        setIsModalOpen(false);
                        return { success: true };

                    } catch (error) {
                        const message = error instanceof Error ? error.message : 'Unknown error';
                        toast.error(message);
                        return { success: false, error: message };
                    }
                }}
            />
        </AnimatePresence>
    );
};