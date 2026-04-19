import { WarehouseShort, WarehouseStoreState } from "@/types/store.types";
import { create } from "zustand";
import { persist } from "zustand/middleware";


export const useWarehouseStore = create<WarehouseStoreState>()(
    persist(
        (set) => ({
            warehouses: null,
            fetchWarehouses: async () => {
                try {
                    set({ isLoading: true, error: null });
                    const res = await fetch('/api/warehouse');
                    if (!res.ok) throw new Error('Failed to fetch warehouse data');
                    const data = await res.json();
                    const warehouses = Array.isArray(data) ? data : data.data ?? [];
                    set({ warehouses, isLoading: false });
                } catch (error) {
                    set({ warehouses: null, error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
                }
            },
            setSelectedWarehouse: (warehouse: WarehouseShort | null) => set({ selectedWarehouse: warehouse }),
            selectedWarehouse: null,
            isLoading: false,
            error: null,
        }),
        { name: 'warehouse-store' }
    )
);