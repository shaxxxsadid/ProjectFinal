'use client';

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CategoryShort } from "@/types/store.types";
import { useCategoryStore } from "@/app/store/categoryStore";

type AttributeType = 'string' | 'number' | 'boolean' | 'date';

interface AttributeForm {
    name: string;
    type: AttributeType;
    unit?: string;
    required: boolean;
}

interface CategoryFormData {
    code: string;
    name: string;
    description?: string;
    parent?: string | null;
    level: number;
    isActive: boolean;
    attributes: AttributeForm[];
}

interface SubmitResult {
    success: boolean;
    error?: string;
    data?: unknown;
}

interface CrudCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CategoryFormData) => Promise<SubmitResult>;
    mode: 'create' | 'edit';
    initialValues?: Partial<CategoryShort> | null;
}

const EMPTY_FORM: CategoryFormData = {
    code: '',
    name: '',
    description: '',
    parent: null,
    level: 1,
    isActive: true,
    attributes: [],
};

const ATTRIBUTE_TYPES: AttributeType[] = ['string', 'number', 'boolean', 'date'];

export const CrudCategoryModal = ({ isOpen, onClose, onSubmit, mode, initialValues }: CrudCategoryModalProps) => {
    const { categories, fetchCategories } = useCategoryStore();
    const [form, setForm] = useState<CategoryFormData>(EMPTY_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        if (!categories) fetchCategories();

        if (mode === 'edit' && initialValues) {
            // Безопасное извлечение ID: проверяем, является ли parent объектом, и берем именно _id
            const rawParent = initialValues.parent;
            const safeParentId = rawParent
                ? typeof rawParent === 'object' && rawParent !== null
                    ? (rawParent as { _id: string })._id // Используем _id, так как id в CategoryParentRef не существует
                    : String(rawParent)
                : null;

            setForm({
                code: initialValues.code ?? '',
                name: initialValues.name ?? '',
                description: initialValues.description ?? '',
                parent: safeParentId, // <-- Теперь здесь гарантированно строка или null
                level: initialValues.level ?? 1,
                isActive: initialValues.isActive ?? true,
                attributes: (initialValues.attributes ?? []).map((a) => ({
                    name: a.name ?? '',
                    type: a.type,
                    unit: a.unit ?? '',
                    required: a.required ?? false,
                })),
            });
        } else {
            setForm(EMPTY_FORM);
        }
        setError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, mode, initialValues]);
    if (!isOpen) return null;

    const handleChange = <K extends keyof CategoryFormData>(key: K, value: CategoryFormData[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleAttributeChange = <K extends keyof AttributeForm>(index: number, key: K, value: AttributeForm[K]) => {
        setForm((prev) => ({
            ...prev,
            attributes: prev.attributes.map((attr, i) => (i === index ? { ...attr, [key]: value } : attr)),
        }));
    };

    const addAttribute = () => {
        setForm((prev) => ({
            ...prev,
            attributes: [...prev.attributes, { name: '', type: 'string', unit: '', required: false }],
        }));
    };

    const removeAttribute = (index: number) => {
        setForm((prev) => ({
            ...prev,
            attributes: prev.attributes.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!form.code.trim() || !form.name.trim()) {
            setError('Code and Name are required');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await onSubmit({
                ...form,
                code: form.code.trim().toUpperCase(),
                name: form.name.trim(),
            });

            if (!res.success) {
                setError(res.error || 'Something went wrong');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const parentOptions = (categories ?? []).filter((c) =>
        mode === 'edit' && initialValues?._id ? String(c._id) !== String(initialValues._id) : true
    );

    return (
        <AnimatePresence>
            <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            >
                <motion.div
                    key="modal"
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col gap-5 p-6 bg-background border border-foreground/20 backdrop-blur-2xl rounded-3xl shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                        <h2 className="text-lg font-bold">
                            {mode === 'create' ? 'New Category' : 'Edit Category'}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
                        >✕</button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Code + Name */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                                    Code
                                </label>
                                <input
                                    type="text"
                                    value={form.code}
                                    onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                                    placeholder="PALLET_EUR"
                                    className="px-3 py-2 rounded-xl bg-foreground/5 border border-foreground/10 text-sm outline-none focus:border-teal-500/40 transition-colors font-mono"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                                    Level
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={form.level}
                                    onChange={(e) => handleChange('level', Number(e.target.value) || 1)}
                                    className="px-3 py-2 rounded-xl bg-foreground/5 border border-foreground/10 text-sm outline-none focus:border-teal-500/40 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                                Name
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="Europallet"
                                className="px-3 py-2 rounded-xl bg-foreground/5 border border-foreground/10 text-sm outline-none focus:border-teal-500/40 transition-colors"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                                Description
                            </label>
                            <textarea
                                value={form.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                rows={3}
                                placeholder="Short description..."
                                className="px-3 py-2 rounded-xl bg-foreground/5 border border-foreground/10 text-sm outline-none focus:border-teal-500/40 transition-colors resize-none"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                                Parent Category
                            </label>
                            <select
                                value={form.parent ?? ''}
                                onChange={(e) => handleChange('parent', e.target.value || null)}
                                className="px-3 py-2 rounded-xl bg-foreground/5 border border-foreground/10 text-sm outline-none focus:border-teal-500/40 transition-colors"
                            >
                                <option value="">— None —</option>
                                {parentOptions.map((c) => (
                                    <option key={String(c._id)} value={String(c._id)}>
                                        {c.name} ({c.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Active toggle */}
                        <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(e) => handleChange('isActive', e.target.checked)}
                                className="w-4 h-4 rounded accent-teal-500"
                            />
                            <span className="text-sm font-medium">Active</span>
                        </label>

                        {/* Attributes */}
                        <div className="flex flex-col gap-2 pt-2 border-t border-foreground/10">
                            <div className="flex items-center justify-between">
                                <label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                                    Attributes
                                </label>
                                <button
                                    type="button"
                                    onClick={addAttribute}
                                    className="text-xs font-medium text-teal-500 hover:text-teal-400 transition-colors"
                                >
                                    + Add attribute
                                </button>
                            </div>

                            {form.attributes.length === 0 && (
                                <p className="text-xs text-muted-foreground italic">No attributes yet</p>
                            )}

                            <div className="flex flex-col gap-2">
                                {form.attributes.map((attr, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 p-2.5 rounded-xl bg-foreground/5 border border-foreground/10"
                                    >
                                        <input
                                            type="text"
                                            value={attr.name}
                                            onChange={(e) => handleAttributeChange(i, 'name', e.target.value)}
                                            placeholder="Attribute name"
                                            className="flex-1 min-w-0 px-2 py-1.5 rounded-lg bg-background border border-foreground/10 text-xs outline-none focus:border-teal-500/40 transition-colors"
                                        />
                                        <select
                                            value={attr.type}
                                            onChange={(e) => handleAttributeChange(i, 'type', e.target.value as AttributeType)}
                                            className="px-2 py-1.5 rounded-lg bg-background border border-foreground/10 text-xs outline-none focus:border-teal-500/40 transition-colors"
                                        >
                                            {ATTRIBUTE_TYPES.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            value={attr.unit}
                                            onChange={(e) => handleAttributeChange(i, 'unit', e.target.value)}
                                            placeholder="unit"
                                            className="w-16 px-2 py-1.5 rounded-lg bg-background border border-foreground/10 text-xs outline-none focus:border-teal-500/40 transition-colors"
                                        />
                                        <label className="flex items-center gap-1 shrink-0 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={attr.required}
                                                onChange={(e) => handleAttributeChange(i, 'required', e.target.checked)}
                                                className="w-3.5 h-3.5 rounded accent-teal-500"
                                            />
                                            <span className="text-[10px] text-muted-foreground">req</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => removeAttribute(i)}
                                            className="p-1 rounded-lg hover:bg-red-500/10 text-red-500 shrink-0 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                                {error}
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t border-foreground/10">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 rounded-xl border border-foreground/10 text-sm font-medium hover:bg-foreground/5 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 rounded-xl border border-teal-500/20 text-teal-500 text-sm font-medium hover:bg-teal-500/10 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};