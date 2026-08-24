import { CategoryShort, CategoryStoreState } from '@/types/store.types';
import { create } from 'zustand';

export const useCategoryStore = create<CategoryStoreState>()((set, get) => ({
    categories: null,
    selectedCategory: null,
    isLoading: false,
    error: null,

    setSelectedCategory: (category) => set({ selectedCategory: category }),

    fetchCategories: async () => {
        try {
            set({ isLoading: true, error: null });
            const res = await fetch('/api/categories');
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

            const result = await res.json();
            const items: CategoryShort[] = Array.isArray(result?.data) ? result.data : [];
            set({ categories: items });
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Ошибка загрузки категорий' });
        } finally {
            set({ isLoading: false });
        }
    },

    createCategory: async (data) => {
        try {
            set({ isLoading: true, error: null });

            // level намеренно не отправляется с клиента: его рассчитывает CategoryService.
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json().catch(() => ({}));

            if (!res.ok || !result.success) {
                const message = result.error || 'Failed to create category';
                set({ error: message, isLoading: false });
                return { success: false, error: message };
            }

            await get().fetchCategories();
            return { success: true, data: result.data as CategoryShort };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message, isLoading: false });
            return { success: false, error: message };
        }
    },

    updateCategory: async (categoryId, data) => {
        try {
            set({ isLoading: true, error: null });

            const res = await fetch('/api/categories', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ _id: categoryId, ...data }),
            });

            const result = await res.json().catch(() => ({}));

            if (!res.ok || !result.success) {
                const message = result.error || 'Failed to update category';
                set({ error: message, isLoading: false });
                return { success: false, error: message };
            }

            // Изменение parent может изменить level всей дочерней ветки,
            // поэтому локального merge одной категории недостаточно.
            await get().fetchCategories();

            const refreshedSelected = get().categories?.find(
                (category) => String(category._id) === String(categoryId)
            ) ?? null;

            set((state) => ({
                selectedCategory:
                    state.selectedCategory && String(state.selectedCategory._id) === String(categoryId)
                        ? refreshedSelected
                        : state.selectedCategory,
                isLoading: false,
            }));

            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message, isLoading: false });
            return { success: false, error: message };
        }
    },

    deleteCategory: async (categoryId) => {
        try {
            set({ isLoading: true, error: null });
            const res = await fetch('/api/categories', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ _id: categoryId }),
            });

            const result = await res.json().catch(() => ({}));

            if (!res.ok || result.success === false) {
                set({ error: result.error || 'Ошибка удаления категории', isLoading: false });
                return;
            }

            set((state) => ({
                categories: state.categories
                    ? state.categories.filter((category) => String(category._id) !== String(categoryId))
                    : state.categories,
                selectedCategory:
                    state.selectedCategory && String(state.selectedCategory._id) === String(categoryId)
                        ? null
                        : state.selectedCategory,
                isLoading: false,
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка удаления категории',
                isLoading: false,
            });
        }
    },
}));
