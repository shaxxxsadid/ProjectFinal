'use client';
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pagination } from "@/app/components/ui/pagination";
import { WarehouseShort } from "@/types/store.types";
import { useWarehouseStore } from "@/app/store/warehouseStore";
import { cn } from "@/lib/utils";
import { FaWarehouse } from "react-icons/fa";

const ITEMS_PER_PAGE = 6;

const TYPE_META: Record<string, { label: string; color: string }> = {
    main: { label: 'Main', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
    transit: { label: 'Transit', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
    storage: { label: 'Storage', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    distribution: { label: 'Distribution', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
    cold: { label: 'Cold', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
};

const ICON_COLORS = [
    "bg-violet-500/10 text-violet-400 border-violet-500/20",
    "bg-sky-500/10 text-sky-400 border-sky-500/20",
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "bg-teal-500/10 text-teal-400 border-teal-500/20",
];

export const WarehouseTable = () => {
    const { warehouses, selectedWarehouse, setSelectedWarehouse } = useWarehouseStore();
    const activeWarehouse: WarehouseShort | null = selectedWarehouse ?? null;
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = useMemo(
        () => Math.ceil((warehouses?.length || 0) / ITEMS_PER_PAGE),
        [warehouses]
    );

    const currentWarehouses = useMemo(() => {
        if (!warehouses) return [];
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return warehouses.slice(start, start + ITEMS_PER_PAGE);
    }, [warehouses, currentPage]);

    return (
        <div className="w-full justify-between flex flex-col min-h-114 gap-2">
            <div className="flex flex-col gap-2">
                <AnimatePresence mode="popLayout">
                    {currentWarehouses.map((warehouse, index) => {
                        const isActive = activeWarehouse?._id === warehouse._id;
                        const iconColor = ICON_COLORS[index % ICON_COLORS.length];
                        const typeMeta = TYPE_META[warehouse.type] ?? { label: warehouse.type, color: 'bg-foreground/10 text-foreground/50 border-foreground/15' };

                        return (
                            <motion.div
                                key={warehouse._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => setSelectedWarehouse(warehouse)}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer border transition-all duration-200',
                                    isActive
                                        ? 'bg-foreground/10 border-foreground/20'
                                        : 'border-transparent hover:bg-foreground/5 hover:border-foreground/10'
                                )}
                            >
                                {/* Иконка */}
                                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center border shrink-0', iconColor)}>
                                    <FaWarehouse size={16} />
                                </div>

                                {/* Название и код */}
                                <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-medium truncate">{warehouse.name}</span>
                                        {!warehouse.isActive && (
                                            <span className="text-[10px] shrink-0 text-foreground/30">inactive</span>
                                        )}
                                    </div>
                                    <span className="font-mono text-[11px] text-foreground/40 truncate">
                                        {warehouse.code}
                                    </span>
                                </div>

                                {/* Тип */}
                                <span className={cn(
                                    'shrink-0 text-[11px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full border',
                                    typeMeta.color
                                )}>
                                    {typeMeta.label}
                                </span>
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