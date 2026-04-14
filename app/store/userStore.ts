import { UserShort, UserStoreState } from "@/types/store.types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUserStore = create<UserStoreState>()(
    persist(
        (set, get) => ({
            user: null,
            selectedUser: [] as UserShort[],
            isLoading: false,
            error: null,

            setSelectedUser: (user: UserShort | null) =>
                set({ selectedUser: user ? [user] : [] }),

            setUser: (user: UserShort[] | null) => set({ user }),
            avatarVersions: {} as Record<string, number>,

            bumpAvatarVersion: (userId: string) => {
                set((state) => ({
                    avatarVersions: { ...(state.avatarVersions || {}), [userId]: ((state.avatarVersions?.[userId] || 0) + 1) }
                }));
            },

            fetchUser: async () => {
                try {
                    set({ isLoading: true, error: null });
                    const res = await fetch('/api/users');
                    if (!res.ok) throw new Error('Failed to fetch user data');
                    const data = await res.json();
                    const users = Array.isArray(data) ? data : data.users ?? [];
                    set({ user: users, isLoading: false });
                } catch (error) {
                    set({ user: null, error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
                }
            },

            toggleUserActive: async (userId: string) => {
                // оптимистичное обновление
                set((state) => ({
                    user: state.user?.map((u) => u._id === userId ? { ...u, isActive: !u.isActive } : u) ?? null,
                    selectedUser: state.selectedUser?.map((u) => u._id === userId ? { ...u, isActive: !u.isActive } : u),
                }));

                try {
                    const res = await fetch(`/api/users/toggle/${userId}`, { method: 'PATCH' });
                    if (!res.ok) throw new Error('Failed to toggle user');
                    const updated = await res.json();

                    set((state) => ({
                        user: state.user?.map((u) => u._id === userId ? { ...u, isActive: updated.isActive, updatedAt: updated.updatedAt } : u) ?? null,
                        selectedUser: state.selectedUser?.map((u) => u._id === userId ? { ...u, isActive: updated.isActive, updatedAt: updated.updatedAt } : u),
                    }));
                } catch (error) {
                    set((state) => ({
                        user: state.user?.map((u) => u._id === userId ? { ...u, isActive: !u.isActive } : u) ?? null,
                        selectedUser: state.selectedUser?.map((u) => u._id === userId ? { ...u, isActive: !u.isActive } : u),
                    }));
                    console.error(error);
                }
            },
            deleteUser: async (userId: string) => {
                let previousUsers: UserShort[] | null = null;
                let previousSelected: UserShort[] | null = null;

                set((state) => {
                    previousUsers = state.user;
                    previousSelected = state.selectedUser;
                    return {
                        user: state.user?.filter((u) => u._id !== userId) ?? null,
                        selectedUser: (state.selectedUser ?? []).filter((u) => u._id !== userId),
                    };
                });

                try {
                    const res = await fetch(`/api/users`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId })
                    });
                    if (!res.ok) throw new Error('Failed to delete user');
                } catch (error) {
                    set({
                        user: previousUsers,
                        selectedUser: previousSelected ?? []
                    });
                    console.error(error);
                }
            },
            updateUser: async (userId: string, data: { username?: string; password?: string, roleId?: string, businessProfileId?: string, lastName?: string, firstName?: string, email?: string }) => {
                try {
                    const res = await fetch(`/api/users/${userId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                    if (!res.ok) throw new Error('Failed to update user');
                    const updated = await res.json();
                    set((state) => ({
                        user: state.user?.map((u) => u._id === userId ? { ...u, ...updated } : u) ?? null,
                        selectedUser: state.selectedUser?.map((u) => u._id === userId ? { ...u, ...updated } : u),
                    }));
                    return { success: true };
                } catch (error) {
                    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
                }
            },
            uploadAvatar: async (userId: string | undefined, file: File) => {
                try {
                    set({ isLoading: true, error: null });

                    const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });

                    const res = await fetch('/api/avatar/user', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ _id: userId, avatar: base64 }),
                    });

                    if (!res.ok) throw new Error('Failed to upload avatar');

                    const data = await res.json();
                    const updatedUser = data?.user;

                    if (updatedUser) {
                        const updatedShort: UserShort = {
                            _id: updatedUser._id,
                            email: updatedUser.email,
                            username: updatedUser.username,
                            firstName: updatedUser.firstName,
                            lastName: updatedUser.lastName,
                            roleId: updatedUser.roleId,
                            businessProfileId: updatedUser.businessProfileId,
                            createdAt: updatedUser.createdAt,
                            updatedAt: updatedUser.updatedAt,
                            isActive: !!updatedUser.isActive,
                        };

                        set((state) => ({
                            user: state.user?.map((u) => u._id === updatedShort._id ? updatedShort : u) ?? state.user,
                            selectedUser: [updatedShort]
                        }));

                        if (userId) {
                            get().bumpAvatarVersion(userId);
                            if (updatedUser.email) get().bumpAvatarVersion(updatedUser.email);
                        }
                    } else {
                        await get().fetchUser();
                        const updated = get().user?.find((u) => u._id === userId) ?? null;
                        set({ selectedUser: updated ? [updated] : [] });
                        if (userId) get().bumpAvatarVersion(userId);
                    }

                    set({ isLoading: false });
                } catch (error) {
                    set({ isLoading: false, error: error instanceof Error ? error.message : 'Unknown error' });
                    console.error('uploadAvatar error', error);
                    throw error;
                }
            },
        }),
        {
            name: 'user-store',
            partialize: (state) => ({
                user: state.user,
                selectedUser: state.selectedUser,
            }),
        }
    )
);