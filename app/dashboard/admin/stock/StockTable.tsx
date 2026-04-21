'use client';
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pagination } from "@/app/components/ui/pagination";
import { StokeShort } from "@/types/store.types";
import { useStokeStore } from "@/app/store/stokeStore";
import { cn } from "@/lib/utils";
import { useProductsStore } from "@/app/store/productStore";
import ProductAvatar from "@/app/components/ui/ProductAvatar";
import { useWarehouseStore } from "@/app/store/warehouseStore";

const ITEMS_PER_PAGE = 6;

const STOCK_COLORS = [
    "bg-violet-500/10 text-violet-400 border-violet-500/20",
    "bg-sky-500/10 text-sky-400 border-sky-500/20",
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "bg-teal-500/10 text-teal-400 border-teal-500/20",
];

const getAvailabilityMeta = (available: number, quantity: number) => {
    if (quantity === 0) return { label: 'Empty', color: 'text-foreground/30 bg-foreground/5 border-foreground/10' };
    const ratio = available / quantity;
    if (ratio > 0.5) return { label: 'In Stock', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (ratio > 0) return { label: 'Low Stock', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    return { label: 'Reserved', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
};

export const StockTable = ({ searchQuery = '' }: { searchQuery?: string }) => {
    const { stock, selectedStock, setSelectedStock } = useStokeStore();
    const { products } = useProductsStore();

    const linkedProducts = useMemo(() => {
        if (!stock || products.items.length === 0) return { names: {} as Record<string, string>, ids: {} as Record<string, string> };
        const names: Record<string, string> = {};
        const ids: Record<string, string> = {};
        products.items.forEach((product) => {
            names[product._id] = product.name;
            ids[product._id] = product._id;
        });
        return { names, ids };
    }, [stock, products.items]);


    const activeStock: StokeShort | null = selectedStock ?? null;
    const [currentPage, setCurrentPage] = useState(1);

    const filteredStock = useMemo(() => {
        if (!stock) return [];
        return stock.filter((item) =>
            item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            linkedProducts.names[item.productId].toLowerCase().includes(searchQuery.toLowerCase()));
    }, [stock, searchQuery, linkedProducts.names]);

    const totalPages = useMemo(
        () => Math.ceil((filteredStock.length || 0) / ITEMS_PER_PAGE),
        [filteredStock]
    );
    const safePage = Math.min(currentPage, Math.max(1, totalPages));
    const currentStock = useMemo(() => {
        if (!filteredStock) return [];
        const start = (safePage - 1) * ITEMS_PER_PAGE;
        return filteredStock.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredStock, safePage]);

    return (
        <div className="w-full justify-between flex flex-col min-h-114 gap-2">
            <div className="flex flex-col gap-2">
                <AnimatePresence mode="popLayout">
                    {currentStock.map((item, index) => {
                        const isActive = activeStock?._id === item._id;
                        const color = STOCK_COLORS[index % STOCK_COLORS.length];
                        const availability = getAvailabilityMeta(item.available, item.quantity);

                        return (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => setSelectedStock(item)}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer border transition-all duration-200',
                                    isActive
                                        ? 'bg-foreground/10 border-foreground/20'
                                        : 'border-transparent hover:bg-foreground/5 hover:border-foreground/10'
                                )}
                            >
                                {/* Бейдж с первой буквой batch */}
                                {
                                    linkedProducts.names[item.productId] ? (
                                        <ProductAvatar
                                            name={linkedProducts.names[item.productId] ?? item.batchNumber}
                                            productId={item.productId}
                                            size="sm"
                                        />
                                    ) : (
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border shrink-0 ${color}`}>
                                            {item.batchNumber.slice(0, 1).toUpperCase()}
                                        </div>
                                    )
                                }


                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="font-medium truncate text-sm">
                                        {linkedProducts.names[item.productId] ?? 'Unknown product'}
                                    </span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="font-mono text-[11px] text-foreground/40 truncate">
                                            {item.batchNumber}
                                        </span>
                                        {item.reserved > 0 && (
                                            <span className="text-[10px] text-rose-400/70 shrink-0">
                                                · {item.reserved} reserved
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Статус доступности */}
                                < div className={
                                    cn(
                                        'shrink-0 text-[11px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full border',
                                        availability.color
                                    )}>
                                    {availability.label}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence >
            </div >

            {totalPages > 1 && (
                <div className="flex justify-center pt-4 border-t border-foreground/10">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div >
    );
};