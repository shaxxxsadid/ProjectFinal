'use client';

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pagination } from "@/app/components/ui/pagination";
import { ProductShort } from "@/types/store.types";
import { useProductsStore } from "@/app/store/productStore";
import ProductAvatar from "@/app/components/ui/ProductAvatar";
import { cn } from "@/lib/utils";

const ADMIN_ITEMS_PER_PAGE = 6;

/**
 * Сетка товаров админ-панели намеренно использует products.items,
 * а не products.filteredItems.
 *
 * filteredItems зависит от categoryFilter каталога. Если пользователь
 * выбрал категорию в каталоге, этот фильтр не должен скрывать товары
 * в Admin -> Products.
 */
export const ProductGrid = () => {
    const {
        products,
        setSelectedProduct,
        selectedProduct,
        avatarVersions,
    } = useProductsStore();

    const { items } = products;
    const [adminPage, setAdminPage] = useState(1);

    const adminTotalPages = useMemo(
        () => Math.max(1, Math.ceil(items.length / ADMIN_ITEMS_PER_PAGE)),
        [items.length]
    );

    // Не меняем state внутри useEffect: просто вычисляем безопасную страницу.
    // Например, если после удаления было 4 страницы, а осталось 3,
    // интерфейс сразу использует последнюю доступную страницу.
    const safeAdminPage = Math.min(adminPage, adminTotalPages);

    const currentProducts = useMemo(() => {
        const start = (safeAdminPage - 1) * ADMIN_ITEMS_PER_PAGE;
        return items.slice(start, start + ADMIN_ITEMS_PER_PAGE);
    }, [items, safeAdminPage]);

    return (
        <div className="w-full flex flex-col justify-between min-h-134 gap-4">
            <div className="grid grid-cols-3 gap-3">
                <AnimatePresence mode="popLayout">
                    {currentProducts.map((product: ProductShort, i: number) => {
                        const isActive = selectedProduct
                            ? String(selectedProduct._id) === String(product._id)
                            : false;

                        return (
                            <motion.div
                                key={String(product._id)}
                                layout
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.25, delay: i * 0.04 }}
                                onClick={() => setSelectedProduct(product)}
                                className={cn(
                                    'group relative rounded-2xl p-3 cursor-pointer transition-all duration-300',
                                    'border flex flex-col gap-2 h-54',
                                    isActive
                                        ? 'bg-foreground/10 border-foreground/20 ring-1 ring-foreground/30'
                                        : 'bg-foreground/5 border-foreground/10 hover:bg-foreground/10 hover:border-foreground/20'
                                )}
                            >
                                <div className="w-full aspect-square rounded-xl overflow-hidden bg-foreground/5 min-h-26 flex items-center justify-center">
                                    <ProductAvatar
                                        name={product.name}
                                        productId={product._id}
                                        size="lg"
                                        avatarVersion={avatarVersions[String(product._id)] ?? 0}
                                    />
                                </div>

                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium truncate leading-tight">{product.name}</span>
                                    <span className={cn(
                                        'font-mono px-2 py-0.5 rounded-md text-[10px] tracking-wide border w-fit mt-1',
                                        'bg-foreground/5 border-foreground/10 text-foreground/50'
                                    )}>
                                        {product.sku || '—'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-1">
                                    <div className="flex flex-wrap gap-1">
                                        {product.isIPPC_Certified && (
                                            <span className={cn(
                                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border',
                                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            )}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                IPPC
                                            </span>
                                        )}
                                        {product.isHeatTreated && (
                                            <span className={cn(
                                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border',
                                                'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                            )}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                HT
                                            </span>
                                        )}
                                    </div>

                                    <span className="text-sm font-semibold text-foreground/80 shrink-0">
                                        {product.price?.toLocaleString('ru-RU')} ₽
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {adminTotalPages > 1 && (
                <div className="flex justify-center pt-4 border-t border-foreground/10">
                    <Pagination
                        currentPage={safeAdminPage}
                        totalPages={adminTotalPages}
                        onPageChange={setAdminPage}
                    />
                </div>
            )}
        </div>
    );
};
