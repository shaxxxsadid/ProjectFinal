import { RoleShort, RoleStoreState } from "@/types/store.types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useRoleStore = create<RoleStoreState>()(
    persist(
        (set) => ({
            roles: null,
            isLoading: false,
            error: null,
            selectedRole: null,
            setSelectedRole: (role) => set({ selectedRole: role }),

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
            updateRole: async (
                roleId: string,
                data: Partial<Omit<RoleShort, '_id' | 'createdAt' | 'updatedAt'>> // 🔧 Partial для частичного обновления
            ) => {
                try {
                    set({ isLoading: true, error: null });

                    const res = await fetch(`/api/roles`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ _id: roleId, ...data }),
                    });

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.error || 'Failed to update role');
                    }

                    const response = await res.json();
                    const updatedRole = response.data ?? response;

                    set((state) => {
                        if (!state.roles) return { isLoading: false };

                        const updatedRoles = state.roles.map((r) =>
                            r._id === roleId ? { ...r, ...updatedRole } : r
                        );

                        const updatedSelected =
                            state.selectedRole?._id === roleId
                                ? { ...state.selectedRole, ...updatedRole }
                                : state.selectedRole;

                        return {
                            roles: updatedRoles,
                            selectedRole: updatedSelected,
                            isLoading: false,
                        };
                    });

                    return { success: true };

                } catch (error) {
                    set((state) => ({
                        roles: state.roles,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        isLoading: false,
                    }));
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            },
            deleteRole: async (roleId: string) => {
                try {
                    set({ isLoading: true, error: null });
                    const res = await fetch(`/api/roles`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ _id: roleId }),
                    });
                    if (!res.ok) throw new Error('Failed to delete role');
                    const data = await res.json();
                    const roles = data.data ?? null;
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