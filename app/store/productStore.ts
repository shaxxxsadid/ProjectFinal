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

// Совмещённая фильтрация: текстовый поиск + категория.
// Вынесено в отдельную функцию, чтобы searchProducts/setCategoryFilter/setProducts
// применяли ОБА фильтра одинаково — иначе легко рассинхронизировать пагинацию
// (например, если поиск сбрасывает категорию или наоборот).
//
// В Product.categoryId хранится полный путь [root, ..., leaf].
// Поэтому categoryIds обычно содержит один выбранный ID из каталога, а товар
// подходит, если этот ID встречается в его пути. Массив оставлен в API store,
// чтобы при необходимости поддерживать объединённые фильтры по нескольким веткам.
const applyFilters = (
    items: ProductShort[],
    query: string | undefined,
    categoryIds: string[] | null
): ProductShort[] => {
    const q = query ?? '';
    const bySearch = q.trim() ? filterItems(items, q, ['name', 'sku'] as (keyof ProductShort)[]) : items;

    if (!categoryIds || categoryIds.length === 0) {
        return bySearch;
    }

    const allowedIds = categoryIds.map((id) => String(id));

    return bySearch.filter((p) => {
        const productCategoryIds = Array.isArray(p.categoryId) ? p.categoryId : [p.categoryId];
        return productCategoryIds.some((catId) => allowedIds.includes(String(catId)));
    });
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
            categoryFilter: null as string[] | null,

            setSelectedProduct: (product) => set({ selectedProduct: product }),

            setProducts: (items) =>
                set((state) => {
                    // Переприменяем активные фильтры (поиск + категория) к свежим данным,
                    // а не сбрасываем их — иначе рефетч посреди активного фильтра
                    // молча покажет все товары вместо отфильтрованных.
                    const filtered = applyFilters(items, state.products.searchQuery, state.categoryFilter);
                    return {
                        products: {
                            ...state.products,
                            items,
                            filteredItems: filtered,
                            pagination: {
                                page: 1,
                                limit: ITEMS_PER_PAGE,
                                total: filtered.length,
                                totalPages: Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE)),
                            },
                            error: null,
                        },
                    };
                }),

            setProductsLoading: (loading) => set({ isLoading: loading }),

            setProductsError: (error) =>
                set((state) => ({ products: { ...state.products, error } })),

            searchProducts: (query) =>
                set((state) => {
                    const filtered = applyFilters(state.products.items, query, state.categoryFilter);
                    return {
                        products: {
                            ...state.products,
                            searchQuery: query,
                            filteredItems: filtered,
                            pagination: {
                                ...state.products.pagination,
                                page: 1,
                                total: filtered.length,
                                totalPages: Math.max(1, Math.ceil(filtered.length / state.products.pagination.limit)),
                            },
                        },
                    };
                }),

            setCategoryFilter: (categoryIds) =>
                set((state) => {
                    const filtered = applyFilters(state.products.items, state.products.searchQuery, categoryIds);
                    return {
                        categoryFilter: categoryIds,
                        products: {
                            ...state.products,
                            filteredItems: filtered,
                            pagination: {
                                ...state.products.pagination,
                                page: 1,
                                total: filtered.length,
                                totalPages: Math.max(1, Math.ceil(filtered.length / state.products.pagination.limit)),
                            },
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
                        const items = state.products.items.map((product) =>
                            String(product._id) === normalizedId
                                ? { ...product, ...updatedProduct }
                                : product
                        );

                        // После смены categoryId товар может войти в активный фильтр
                        // или выйти из него, поэтому filteredItems нужно пересчитать,
                        // а не просто заменить объект в старом массиве.
                        const filteredItems = applyFilters(
                            items,
                            state.products.searchQuery,
                            state.categoryFilter
                        );

                        const updatedSelected =
                            state.selectedProduct && String(state.selectedProduct._id) === normalizedId
                                ? { ...state.selectedProduct, ...updatedProduct }
                                : state.selectedProduct;

                        return {
                            products: {
                                ...state.products,
                                items,
                                filteredItems,
                                pagination: {
                                    ...state.products.pagination,
                                    page: 1,
                                    total: filteredItems.length,
                                    totalPages: Math.max(1, Math.ceil(filteredItems.length / state.products.pagination.limit)),
                                },
                            },
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
                    if (!res.ok || result.success === false) {
                        throw new Error(result.error || 'Failed to delete product');
                    }

                    set((state) => {
                        const items = state.products.items.filter((product) => String(product._id) !== String(_id));
                        const filteredItems = applyFilters(
                            items,
                            state.products.searchQuery,
                            state.categoryFilter
                        );

                        return {
                            selectedProduct:
                                state.selectedProduct && String(state.selectedProduct._id) === String(_id)
                                    ? null
                                    : state.selectedProduct,
                            products: {
                                ...state.products,
                                items,
                                filteredItems,
                                pagination: {
                                    ...state.products.pagination,
                                    page: 1,
                                    total: filteredItems.length,
                                    totalPages: Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE)),
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
                categoryFilter: state.categoryFilter,
                products: {
                    ...state.products,
                    items: [],
                    filteredItems: [],
                },
            }),
        }
    )
);