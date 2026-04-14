import { RoleStoreState } from "@/types/store.types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useRoleStore = create<RoleStoreState>()(
    persist(
        (set) => ({
            roles: null,
            isLoading: false,
            error: null,

            fetchRoles: async () => {
                try {
                    set({ isLoading: true, error: null });
                    const res = await fetch('/api/roles');
                    if (!res.ok) throw new Error('Failed to fetch role data');
                    const data = await res.json();
                    const roles = Array.isArray(data) ? data : data.data ?? [];
                    set({ roles, isLoading: false });
                } catch (error) {
                    set({ roles: null, error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
                }
            },
        }),
        {
            name: 'role-storage',
        }
    )
);