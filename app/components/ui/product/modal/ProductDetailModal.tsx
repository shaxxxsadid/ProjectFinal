'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { ProductShort } from '@/types/store.types';
import ProductAvatar from '@/app/components/ui/ProductAvatar';

interface ProductDetailModalProps {
    product: ProductShort | null;
    onClose: () => void;
    avatarVersion?: number;
    compact?: boolean;
}

export const ProductDetailModal = ({
    product,
    onClose,
    avatarVersion,
    compact = false
}: ProductDetailModalProps) => {
    console.log('Price', product?.price);
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (product) window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [product, onClose]);

    useEffect(() => {
        document.body.style.overflow = product ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [product]);

    return (
        <AnimatePresence>
            {product && (
                <div className={cn(
                    "fixed inset-0 z-50 flex items-center justify-center",
                    compact ? "p-2" : "p-4 sm:p-8"
                )}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/65 backdrop-blur-md"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={cn(
                            "relative w-full flex flex-col overflow-hidden",
                            "bg-background rounded-2xl shadow-2xl border border-foreground/10",
                            compact ? "max-w-sm max-h-[85vh]" : "max-w-md max-h-[92vh]"
                        )}
                    >
                        {/* Close */}
                        <motion.button
                            onClick={onClose}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={cn(
                                "absolute z-20 p-1.5 rounded-lg bg-background/60 backdrop-blur-sm",
                                "text-muted-foreground hover:text-foreground hover:bg-foreground/10",
                                "transition-colors border border-foreground/10",
                                compact ? "top-2 right-2" : "top-3.5 right-3.5"
                            )}
                            aria-label="Закрыть"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>

                        {/* АВАТАРКА */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.25 }}
                            className={cn(
                                "relative w-full shrink-0 overflow-hidden bg-foreground/5 border-b border-foreground/10",
                                compact ? "h-36" : "h-52"
                            )}
                        >
                            <ProductAvatar
                                name={product.name}
                                productId={product._id}
                                avatarVersion={avatarVersion}
                                size={compact ? "xl" : "full"}
                            />
                            <div className="absolute bottom-0 inset-x-0 h-8 bg-linear-to-t from-background to-transparent pointer-events-none" />
                        </motion.div>

                        {/* КОНТЕНТ */}
                        <div className={cn(
                            "overflow-y-auto flex-1 px-4 space-y-3",
                            compact ? "py-3" : "py-5 px-5"
                        )}>
                            {/* Название */}
                            <div>
                                <h2 className={cn(
                                    "font-semibold tracking-tight",
                                    compact ? "text-lg" : "text-xl"
                                )}>
                                    {product.name}
                                </h2>
                            </div>

                            <div className="rounded-xl border border-foreground/10 overflow-hidden divide-y divide-foreground/8">
                                {/* Код товара (SKU) */}
                                <SpecRow
                                    label="Код товара"
                                    value={product.sku}
                                    mono
                                    compact={compact}
                                />

                                {/* Категория */}
                                {product.categoryId && (
                                    <SpecRow
                                        label="Категория"
                                        value={product.categoryId}
                                        compact={compact}
                                    />
                                )}

                                {/* Габариты */}
                                <SpecRow
                                    label="Габариты"
                                    value={`${product.width} × ${product.height} × ${product.length} см`}
                                    mono
                                    compact={compact}
                                />

                                {/* Вес */}
                                <SpecRow
                                    label="Вес"
                                    value={`${product.weight} кг`}
                                    mono
                                    compact={compact}
                                />

                                {/* Цена */}
                                {product.price != null && (
                                    <SpecRow
                                        label="Цена"
                                        value={product.price.toLocaleString('ru-RU', {
                                            style: 'currency',
                                            currency: 'RUB',
                                            maximumFractionDigits: 0,
                                        })}
                                        compact={compact}
                                    />
                                )}

                                {/* Сертификаты — Group Box */}
                                {(product.isIPPC_Certified || product.isHeatTreated) && (
                                    <div className={cn(
                                        "px-3",
                                        compact ? "py-1.5" : "py-2.5",
                                        "bg-foreground/1.5"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "text-muted-foreground shrink-0",
                                                compact ? "text-xs" : "text-sm"
                                            )}>
                                                Сертификаты:
                                            </span>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {product.isIPPC_Certified && (
                                                    <span className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                                                        "bg-emerald-500/10 text-emerald-700 border-emerald-200/50",
                                                        "dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25"
                                                    )}>
                                                        IPPC Certified
                                                    </span>
                                                )}
                                                {product.isHeatTreated && (
                                                    <span className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                                                        "bg-orange-500/10 text-orange-700 border-orange-200/50",
                                                        "dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/25"
                                                    )}>
                                                        Heat Treated
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// ── Строка характеристики ──
const SpecRow = ({
    label,
    value,
    mono = false,
    compact = false,
}: {
    label: string;
    value: string;
    mono?: boolean;
    compact?: boolean;
}) => (
    <div className={cn(
        "flex items-center justify-between gap-3 px-3 transition-colors",
        compact ? "py-1.5" : "py-2.5",
        "hover:bg-foreground/5"
    )}>
        <span className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>
            {label}
        </span>
        <span className={cn(
            "text-right break-all",
            compact ? "text-xs" : "text-sm",
            mono && "font-mono",
            "text-foreground/90"
        )}>
            {value}
        </span>
    </div>
);