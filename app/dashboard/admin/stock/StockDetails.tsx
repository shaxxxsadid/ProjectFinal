'use client';
import { AnimatePresence, motion } from "framer-motion";
import { StokeShort } from "@/types/store.types";
import { useStokeStore } from "@/app/store/stokeStore";
import { useProductsStore } from "@/app/store/productStore";
import ProductAvatar from "@/app/components/ui/ProductAvatar";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { useWarehouseStore } from "@/app/store/warehouseStore";
import toast from "react-hot-toast";
import { StockCrudModal } from "@/app/components/ui/admin/modal/StockCrudModal";

const getAvailabilityMeta = (available: number, quantity: number) => {
    if (quantity === 0) return { label: 'Empty', color: 'text-foreground/30 bg-foreground/5 border-foreground/10' };
    const ratio = available / quantity;
    if (ratio > 0.5) return { label: 'In Stock', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (ratio > 0) return { label: 'Low Stock', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    return { label: 'Reserved', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
};

export const StockDetails = () => {
    const { selectedStock, setSelectedStock, deleteStock, updateStock } = useStokeStore();
    const { products } = useProductsStore();
    const { warehouses } = useWarehouseStore();
    const activeStock: StokeShort | null = selectedStock ?? null;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStock, setEditingStock] = useState<StokeShort | null>(null);
    const productName = useMemo(() => {
        if (!activeStock) return null;
        return products.items.find(p => p._id === activeStock.productId)?.name ?? null;
    }, [activeStock, products.items]);

    const warehouseName = useMemo(() => {
        if (!activeStock) return null;
        if (!warehouses) return null;
        return warehouses.find(p => p._id === activeStock.warehouseId)?.name ?? null;
    }, [activeStock, warehouses]);

    if (!activeStock) {
        return <div className="w-full h-90 rounded-3xl border border-transparent" />;
    }

    const availability = getAvailabilityMeta(activeStock.available, activeStock.quantity);
    const availabilityPercent = activeStock.quantity > 0
        ? Math.round((activeStock.available / activeStock.quantity) * 100)
        : 0;

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
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stock Details</span>
                    <button
                        onClick={() => setSelectedStock(null)}
                        className="p-1 rounded-full hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
                    >✕</button>
                </div>

                {/* Avatar + Name */}
                <div className="flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-foreground/5 flex items-center justify-center">
                        <ProductAvatar
                            name={productName ?? activeStock.batchNumber}
                            productId={activeStock.productId}
                            size="lg"
                        />
                    </div>

                    <div className="text-center">
                        <h3 className="font-bold text-lg leading-tight">
                            {productName ?? 'Unknown product'}
                        </h3>
                        <span className="font-mono px-2.5 py-1 rounded-lg text-xs tracking-wide border bg-foreground/5 border-foreground/10 text-foreground/50 mt-1 inline-block">
                            {activeStock.batchNumber}
                        </span>
                    </div>

                    {/* Статус */}
                    <span className={cn(
                        'text-[11px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full border',
                        availability.color
                    )}>
                        {availability.label}
                    </span>
                </div>

                {/* Прогресс бар доступности */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[11px] text-foreground/40">
                        <span>Available</span>
                        <span>{availabilityPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                        <motion.div
                            className={cn('h-full rounded-full', availabilityPercent > 50 ? 'bg-emerald-500' : availabilityPercent > 0 ? 'bg-amber-500' : 'bg-rose-500')}
                            initial={{ width: 0 }}
                            animate={{ width: `${availabilityPercent}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                    </div>
                </div>

                {/* Количества */}
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { label: 'Total', value: activeStock.quantity, color: 'text-foreground/80' },
                        { label: 'Available', value: activeStock.available, color: 'text-emerald-400' },
                        { label: 'Reserved', value: activeStock.reserved, color: 'text-rose-400' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-foreground/5 border border-foreground/10">
                            <span className={cn('text-lg font-bold', color)}>{value}</span>
                            <span className="text-[10px] uppercase tracking-widest text-foreground/35">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Info Fields */}
                <div className="space-y-1 pt-2">
                    {[
                        { label: 'Stock ID', value: activeStock._id },
                        { label: 'Product', value: productName ?? activeStock.productId },
                        { label: 'Warehouse', value: warehouseName ?? activeStock.warehouseId },
                        { label: 'Expiry Date', value: activeStock.expiryDate ? new Date(activeStock.expiryDate).toLocaleDateString() : '—' },
                        { label: 'Created At', value: new Date(activeStock.createdAt).toLocaleString() },
                        { label: 'Updated At', value: new Date(activeStock.updatedAt).toLocaleString() },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between gap-4 py-2.5 border-b border-foreground/5 last:border-0">
                            <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider shrink-0">{label}</span>
                            <span className="text-sm text-right truncate font-medium text-foreground/80" title={value}>{value}</span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-foreground/10">
                    <button className=" cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-teal-500/20 text-teal-500 text-sm font-medium hover:bg-foreground/5 transition-colors duration-200"
                        onClick={() => setIsModalOpen(true)}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182L7.5 19.213l-4.5 1.125 1.125-4.5L16.862 3.487z" />
                        </svg>
                        Edit
                    </button>
                    <button
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-500 text-sm font-medium hover:bg-red-500/10 transition-colors duration-200"
                        onClick={() => {
                            toast.promise(deleteStock(activeStock._id), { loading: 'Deleting...', success: 'Stock deleted', error: 'Failed to delete stock' });
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Delete
                    </button>
                </div>
            </motion.div>
            <StockCrudModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingStock(null);
                }}
                mode={'edit'}
                initialValues={activeStock}
                products={products.items || []}
                warehouses={warehouses || []}
                onSubmit={async (data) => {
                    const result = await updateStock(activeStock._id, data as Omit<StokeShort, '_id' | 'createdAt' | 'updatedAt'>);
                    if (result?.success) {
                        toast.success('Stock updated');
                        setIsModalOpen(false);
                        setEditingStock(null);
                    } else {
                        toast.error(result?.error || 'Failed to update stock');
                    }
                    return result ?? { success: false, error: 'Unknown error' };
                }}
            />
        </AnimatePresence>
    );
};