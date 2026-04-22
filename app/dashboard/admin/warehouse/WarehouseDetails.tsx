'use client';

import { AnimatePresence, motion } from "framer-motion";
import { WarehouseShort } from "@/types/store.types";
import { useWarehouseStore } from "@/app/store/warehouseStore";
import { cn } from "@/lib/utils";
import { FaWarehouse } from "react-icons/fa";
import { useMemo, useState } from "react";
import { useUserStore } from "@/app/store/userStore";
import toast from "react-hot-toast";
import { WarehouseCrudModal } from "@/app/components/ui/admin/modal/WarehouseCrudModal";
import { useRoleStore } from "@/app/store/roleStore";

const TYPE_META: Record<string, { label: string; color: string }> = {
    main: { label: 'Main', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
    transit: { label: 'Transit', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
    storage: { label: 'Storage', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    distribution: { label: 'Distribution', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
    cold: { label: 'Cold', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
};

export const WarehouseDetails = () => {
    const { selectedWarehouse, setSelectedWarehouse, deleteWarehouse, updateWarehouse } = useWarehouseStore();
    const activeWarehouse: WarehouseShort | null = selectedWarehouse ?? null;
    const { user: users } = useUserStore();
    const { roles } = useRoleStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const managers = useMemo(() => {
        const managerRoleId = roles?.find(r => r.name === 'manager')?._id;
        return users?.filter(u => u.roleId === managerRoleId) ?? [];
    }, [users, roles]);
    
    const managerName = useMemo(() => {
        if (!users || !activeWarehouse?.managerId) return null;
        const manager = Array.isArray(users)
            ? users.find(u => u._id === activeWarehouse.managerId)
            : null;
        return manager ? `${manager.firstName} ${manager.lastName ?? manager.email}` : null;
    }, [users, activeWarehouse]);

    if (!activeWarehouse) {
        return <div className="w-full h-90 rounded-3xl border border-transparent" />;
    }

    const typeMeta = TYPE_META[activeWarehouse.type] ?? {
        label: activeWarehouse.type,
        color: 'bg-foreground/10 text-foreground/50 border-foreground/15'
    };

    const capacityPercent = activeWarehouse.maxPallets > 0
        ? Math.min(100, Math.round((activeWarehouse.totalAreaSqm / activeWarehouse.maxPallets) * 10))
        : 0;

    return (
        <AnimatePresence mode="popLayout">
            {/* ✅ Динамический key для корректной анимации при смене склада */}
            <motion.div
                key={activeWarehouse._id}
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="flex flex-col gap-5 p-6 bg-background border border-foreground/20 backdrop-blur-2xl rounded-3xl shadow-2xl w-full shrink-0 overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Warehouse Details</span>
                    <button
                        onClick={() => setSelectedWarehouse(null)}
                        className="p-1 rounded-full hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
                    >✕</button>
                </div>

                {/* Icon + Name */}
                <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                        'w-24 h-24 rounded-2xl flex items-center justify-center border',
                        typeMeta.color
                    )}>
                        <FaWarehouse size={36} />
                    </div>

                    <div className="text-center">
                        <h3 className="font-bold text-lg leading-tight">{activeWarehouse.name}</h3>
                        <span className="font-mono px-2.5 py-1 rounded-lg text-xs tracking-wide border bg-foreground/5 border-foreground/10 text-foreground/50 mt-1 inline-block">
                            {activeWarehouse.code}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={cn(
                            'text-[11px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full border',
                            typeMeta.color
                        )}>
                            {typeMeta.label}
                        </span>
                        <span className={cn(
                            'text-[11px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full border',
                            activeWarehouse.isActive
                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                : 'text-foreground/30 bg-foreground/5 border-foreground/10'
                        )}>
                            {activeWarehouse.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                {/* Capacity */}
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { label: 'Max Pallets', value: activeWarehouse.maxPallets, color: 'text-foreground/80' },
                        { label: 'Area m²', value: activeWarehouse.totalAreaSqm, color: 'text-sky-400' },
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
                        { label: 'Warehouse ID', value: activeWarehouse._id },
                        { label: 'Manager', value: managerName ?? activeWarehouse.managerId },
                        { label: 'Phone', value: activeWarehouse.phone },
                        { label: 'Email', value: activeWarehouse.email },
                        { label: 'Created At', value: new Date(activeWarehouse.createdAt).toLocaleString() },
                        { label: 'Updated At', value: new Date(activeWarehouse.updatedAt).toLocaleString() },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between gap-4 py-2.5 border-b border-foreground/5 last:border-0">
                            <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider shrink-0">{label}</span>
                            <span className="text-sm text-right truncate font-medium text-foreground/80" title={String(value)}>{String(value)}</span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-foreground/10">
                    {/* ✅ Добавлен onClick для открытия модалки */}
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-teal-500/20 text-teal-500 text-sm font-medium hover:bg-foreground/5 transition-colors duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182L7.5 19.213l-4.5 1.125 1.125-4.5L16.862 3.487z" />
                        </svg>
                        Edit
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-500 text-sm font-medium hover:bg-red-500/10 transition-colors duration-200"
                        onClick={() => {
                            toast.promise(deleteWarehouse(activeWarehouse._id), { loading: 'Deleting warehouse...', success: 'Warehouse deleted!', error: 'Failed to delete warehouse' });
                        }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Delete
                    </button>
                </div>
            </motion.div>
            
            {/* ✅ Убрано as UserShort[], заменено на безопасный fallback */}
            <WarehouseCrudModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={async (data) => {
                    const result = await updateWarehouse(activeWarehouse._id, data as Omit<WarehouseShort, '_id' | 'createdAt' | 'updatedAt'>);
                    if (result.success) {
                        setIsModalOpen(false);
                        toast.success('Warehouse updated!');
                    } else { 
                        toast.error(result.error || 'Failed to update warehouse');
                    }
                    return result;
                }}
                mode="edit"
                initialValues={activeWarehouse}
                managers={managers}
            />
        </AnimatePresence>
    );
};