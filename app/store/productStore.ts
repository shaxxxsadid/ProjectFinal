import { ProductShort, ProductStoreState } from '@/types/store.types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const filterItems = <T extends Record<string, any>>( // eslint-disable-line
    items: T[],
    query: string,
    fields: (keyof T)[]
): T[] => {
    if (!query.trim()) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter((item) =>
        fields.some((field) => {
            const value = item[field];
            if (typeof value === 'string') return value.toLowerCase().includes(lowerQuery);
            if (typeof value === 'number') return value.toString().includes(lowerQuery);
            return false;
        })
    );
};

const ITEMS_PER_PAGE = 6;

export const useProductsStore = create<ProductStoreState>()(
    persist(
        (set, get) => ({
            products: {
                items: [],
                filteredItems: [],
                pagination: {
                    page: 1,
                    limit: ITEMS_PER_PAGE,
                    total: 0,
                    totalPages: 0,
                },
                searchQuery: '',
                error: null,
            },
            selectedProduct: null,
            isLoading: false,
            avatarVersions: {} as Record<string, number>,

            setSelectedProduct: (product) => set({ selectedProduct: product }),

            setProducts: (items, total) =>
                set((state) => ({
                    products: {
                        ...state.products,
                        items,
                        filteredItems: items,
                        pagination: {
                            page: 1,
                            limit: ITEMS_PER_PAGE,
                            total,
                            totalPages: Math.ceil(total / ITEMS_PER_PAGE),
                        },
                        error: null,
                    },
                })),

            setProductsLoading: (loading) => set({ isLoading: loading }),

            setProductsError: (error) =>
                set((state) => ({ products: { ...state.products, error } })),

            searchProducts: (query) =>
                set((state) => {
                    const filtered = query.trim()
                        ? filterItems(state.products.items, query, ['name', 'sku'] as (keyof ProductShort)[])
                        : state.products.items;
                    return {
                        products: {
                            ...state.products,
                            searchQuery: query,
                            filteredItems: filtered,
                            pagination: { ...state.products.pagination, page: 1 },
                        },
                    };
                }),

            setProductPage: (page) =>
                set((state) => ({
                    products: {
                        ...state.products,
                        pagination: { ...state.products.pagination, page },
                    },
                })),

            fetchProducts: async () => {
                const { setProductsLoading, setProducts, setProductsError } = get();
                try {
                    setProductsLoading(true);
                    setProductsError(null);
                    const res = await fetch('/api/products');
                    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                    const data = await res.json();
                    const items: ProductShort[] = Array.isArray(data)
                        ? data
                        : Array.isArray(data?.data)
                        ? data.data
                        : [];
                    const total = typeof data?.total === 'number' ? data.total : items.length;
                    setProducts(items, total);
                } catch (error) {
                    setProductsError(error instanceof Error ? error.message : 'Ошибка загрузки товаров');
                } finally {
                    setProductsLoading(false);
                }
            },

            fetchProductBySku: async (sku) => {
                try {
                    set({ isLoading: true, products: { ...get().products, error: null } });
                    const res = await fetch(`/api/products/${encodeURIComponent(sku)}`);
                    if (!res.ok) throw new Error('Failed to fetch product');
                    const result = await res.json();
                    if (!result.success) throw new Error(result.error || 'Product not found');
                    return result.data as ProductShort;
                } catch (error) {
                    set((state) => ({
                        products: {
                            ...state.products,
                            error: error instanceof Error ? error.message : 'Unknown error',
                        },
                    }));
                    return null;
                } finally {
                    set({ isLoading: false });
                }
            },

            createProduct: async (data) => {
                try {
                    set({ isLoading: true, products: { ...get().products, error: null } });

                    const res = await fetch('/api/products', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.error || 'Failed to create product');
                    }

                    const response = await res.json();
                    const createdProduct = response.data ?? response;

                    await get().fetchProducts();
                    set({ isLoading: false });

                    return { success: true, data: createdProduct };
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unknown error';
                    set((state) => ({
                        products: { ...state.products, error: message },
                        isLoading: false,
                    }));
                    return { success: false, error: message };
                }
            },

            updateProduct: async (productId, data) => {
                try {
                    set({ isLoading: true, products: { ...get().products, error: null } });

                    const res = await fetch('/api/products', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ _id: productId, ...data }),
                    });

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.error || 'Failed to update product');
                    }

                    const response = await res.json();
                    const updatedProduct = response.data ?? response;
                    const normalizedId = String(productId);

                    set((state) => {
                        const items = state.products.items.map((p) =>
                            String(p._id) === normalizedId ? { ...p, ...updatedProduct } : p
                        );
                        const filteredItems = state.products.filteredItems.map((p) =>
                            String(p._id) === normalizedId ? { ...p, ...updatedProduct } : p
                        );
                        const updatedSelected =
                            state.selectedProduct && String(state.selectedProduct._id) === normalizedId
                                ? { ...state.selectedProduct, ...updatedProduct }
                                : state.selectedProduct;

                        return {
                            products: { ...state.products, items, filteredItems },
                            selectedProduct: updatedSelected,
                            isLoading: false,
                            avatarVersions: {
                                ...state.avatarVersions,
                                [normalizedId]: (state.avatarVersions[normalizedId] ?? 0) + 1,
                            },
                        };
                    });

                    return { success: true, data: updatedProduct };
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unknown error';
                    set((state) => ({
                        // ⚠️ Никогда не сбрасываем products при ошибке — тот же принцип, что в provider store
                        products: { ...state.products, error: message },
                        isLoading: false,
                    }));
                    return { success: false, error: message };
                }
            },

            deleteProduct: async (_id) => {
                try {
                    set({ isLoading: true, products: { ...get().products, error: null } });

                    const res = await fetch('/api/products', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ _id }),
                    });

                    const result = await res.json().catch(() => ({}));
                    if (!res.ok || (result.success === false)) {
                        throw new Error(result.error || 'Failed to delete product');
                    }

                    set((state) => {
                        const items = state.products.items.filter((p) => p._id !== _id);
                        const filteredItems = state.products.filteredItems.filter((p) => p._id !== _id);
                        const total = items.length;
                        return {
                            selectedProduct: state.selectedProduct?._id === _id ? null : state.selectedProduct,
                            products: {
                                ...state.products,
                                items,
                                filteredItems,
                                pagination: {
                                    ...state.products.pagination,
                                    total,
                                    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
                                },
                            },
                            isLoading: false,
                        };
                    });

                    return { success: true };
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Ошибка удаления товара';
                    set((state) => ({
                        products: { ...state.products, error: message },
                        isLoading: false,
                    }));
                    return { success: false, error: message };
                }
            },
        }),
        {
            name: 'productStore',
            // Список товаров может тянуть за собой base64-аватарки — не кладём его в localStorage целиком,
            // персистим только лёгкие вещи (в отличие от providerStore, где данных немного и персист полный)
            partialize: (state) => ({
                avatarVersions: state.avatarVersions,
                products: {
                    ...state.products,
                    items: [],
                    filteredItems: [],
                },
            }),
        }
    )
);