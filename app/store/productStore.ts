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

    setProducts: (items: ProductShort[], total: number) => void;
    setProductsLoading: (loading: boolean) => void;
    setProductsError: (error: string | null) => void;
    searchProducts: (query: string) => void;
    setProductPage: (page: number) => void;
    fetchProducts: () => Promise<void>;
}

// 🔹 Вспомогательная функция фильтрации (простая, без зависимостей)
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
            if (typeof value === 'string') {
                return value.toLowerCase().includes(lowerQuery);
            }
            if (typeof value === 'number') {
                return value.toString().includes(lowerQuery);
            }
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

    setProductsError: (error) =>
        set((state) => ({
            products: { ...state.products, error },
        })),

    searchProducts: (query) =>
        set((state) => {
            const { items } = state.products;

            // ✅ Если запрос пустой — показываем все товары
            const filtered = query.trim()
                ? filterItems(items, query, ['name', 'sku'] as (keyof ProductShort)[])
                : items;

            return {
                products: {
                    ...state.products,
                    searchQuery: query,
                    filteredItems: filtered, // ✅ Важно: не items, а filtered
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

            // Поддержка разных форматов ответа: массив или { items, total }
            const items: ProductShort[] = Array.isArray(data)
                ? data
                : Array.isArray(data?.items)
                    ? data.items
                    : [];

            const total = typeof data?.total === 'number'
                ? data.total
                : items.length;

            setProducts(items, total);
        } catch (err) {
            console.error('Failed to fetch products:', err);
            setProductsError(err instanceof Error ? err.message : 'Ошибка загрузки товаров');
        } finally {
            setProductsLoading(false);
        }
    },
}));