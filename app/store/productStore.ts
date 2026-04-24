import { ProductShort } from '@/types/store.types';
import { create } from 'zustand';

export interface PaginationState {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface DataListState<T> {
    items: T[];
    filteredItems: T[];
    pagination: PaginationState;
    searchQuery?: string;
    error?: string | null;
}

interface ProductsStore {
    productIsLoading: boolean;
    products: DataListState<ProductShort>;
    selectedProduct: ProductShort | null;
    avatarVersions: Record<string, number>; // ✅ исправлено
    createProduct: (product: ProductShort) => Promise<{ success: boolean; error?: string; data?: ProductShort }>;
    updateProduct: (productId: string, data: Omit<ProductShort, '_id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
    setSelectedProduct: (product: ProductShort | null) => void;
    setProducts: (items: ProductShort[], total: number) => void;
    setProductsLoading: (loading: boolean) => void;
    setProductsError: (error: string | null) => void;
    searchProducts: (query: string) => void;
    setProductPage: (page: number) => void;
    fetchProducts: () => Promise<void>;
    deleteProduct: (_id: string) => Promise<void>;
}

const filterItems = <T extends Record<string, any>>(// eslint-disable-line
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

const initialProductsState: DataListState<ProductShort> = {
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
};

export const useProductsStore = create<ProductsStore>((set, get) => ({
    productIsLoading: false,
    products: initialProductsState,
    selectedProduct: null,
    avatarVersions: {}, // ✅ исправлено

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

    setProductsLoading: (loading) => set({ productIsLoading: loading }),
    setProductsError: (error) => set((state) => ({ products: { ...state.products, error } })),

    createProduct: async (product) => {
        try {
            set({ productIsLoading: true, products: { ...get().products, error: null } });
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product),
            });
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Failed to create product');
            await get().fetchProducts();
            return { success: true, error: undefined };
        } catch (error) {
            set({
                productIsLoading: false,
                products: { ...get().products, error: error instanceof Error ? error.message : 'Unknown error' },
            });
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    },

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
            const items: ProductShort[] = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
            const total = typeof data?.total === 'number' ? data.total : items.length;
            setProducts(items, total);
        } catch (err) {
            console.error('Failed to fetch products:', err);
            setProductsError(err instanceof Error ? err.message : 'Ошибка загрузки товаров');
        } finally {
            setProductsLoading(false);
        }
    },

    updateProduct: async (productId, data) => {
        try {
            set({ productIsLoading: true, products: { ...get().products, error: null } });

            const res = await fetch(`/api/products`, {
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
                const items = state.products.items.map(p =>
                    String(p._id) === normalizedId ? { ...p, ...updatedProduct } : p
                );
                const filteredItems = state.products.filteredItems.map(p =>
                    String(p._id) === normalizedId ? { ...p, ...updatedProduct } : p
                );
                const updatedSelected = state.selectedProduct && String(state.selectedProduct._id) === normalizedId
                    ? { ...state.selectedProduct, ...updatedProduct }
                    : state.selectedProduct;

                return {
                    products: { ...state.products, items, filteredItems },
                    selectedProduct: updatedSelected,
                    productIsLoading: false,
                    avatarVersions: {
                        ...state.avatarVersions,
                        [normalizedId]: (state.avatarVersions[normalizedId] ?? 0) + 1,
                    },
                };
            });
            return { success: true };
        } catch (error) {
            set((state) => ({
                products: { ...state.products, error: error instanceof Error ? error.message : 'Unknown error' },
                productIsLoading: false,
            }));
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    },

    deleteProduct: async (_id) => {
        const { setProductsLoading, setProductsError } = get();
        try {
            setProductsLoading(true);
            setProductsError(null);
            const res = await fetch('/api/products', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ _id }),
            });
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Failed to delete product');
            set((state) => {
                const items = state.products.items.filter(p => p._id !== _id);
                const filteredItems = state.products.filteredItems.filter(p => p._id !== _id);
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
                };
            });
        } catch (err) {
            setProductsError(err instanceof Error ? err.message : 'Ошибка удаления товара');
        } finally {
            setProductsLoading(false);
        }
    },
}));