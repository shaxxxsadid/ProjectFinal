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
            updateWarehouse: async (warehouseId: string, data: Omit<WarehouseShort, '_id' | 'createdAt' | 'updatedAt'>) => {
                try {
                    set({ isLoading: true, error: null });

                    const res = await fetch(`/api/warehouse`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ _id: warehouseId, ...data }),
                    });

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.error || 'Failed to update warehouse');
                    }

                    const response = await res.json();
                    const updatedWarehouse = response.data ?? response;

                    // ✅ Нормализуем warehouseId для надёжного сравнения
                    const normalizedId = String(warehouseId);

                    set((state) => {
                        if (!state.warehouses) return { isLoading: false };

                        const updatedWarehouses = state.warehouses.map((w) =>
                            String(w._id) === normalizedId ? { ...w, ...updatedWarehouse } : w
                        );

                        const updatedSelected = state.selectedWarehouse
                            ? String(state.selectedWarehouse._id) === normalizedId
                                ? { ...state.selectedWarehouse, ...updatedWarehouse }
                                : state.selectedWarehouse
                            : null;

                        return {
                            warehouses: updatedWarehouses,
                            selectedWarehouse: updatedSelected,
                            isLoading: false,
                        };
                    });

                    return { success: true };
                } catch (error) {
                    set((state) => ({
                        // ✅ Сохраняем предыдущее состояние складов при ошибке
                        warehouses: state.warehouses,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        isLoading: false,
                    }));
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            },
            deleteWarehouse: async (warehouseId: string) => {
                try {
                    set({ isLoading: true, error: null });
                    const res = await fetch(`/api/warehouse`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ _id: warehouseId }),
                    });
                    if (!res.ok) throw new Error('Failed to delete warehouse');
                    const data = await res.json();
                    const warehouses = data.data ?? null;
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