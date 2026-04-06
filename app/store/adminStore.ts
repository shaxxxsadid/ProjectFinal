'use client';

import { create } from 'zustand';
import { AdminStoreState, ProductShort, UserShort, StokeShort, WarehouseShort } from '@/types/store.types';

const ITEMS_PER_PAGE = 6;

const createDataState = <T extends { _id: string }>(
    initialItems: T[] = [],
    initialTotal: number = 0
) => ({
    items: initialItems,
    loading: false,
    error: null as string | null,
    pagination: {
        page: 1,
        limit: ITEMS_PER_PAGE,
        total: initialTotal,
        totalPages: Math.ceil(initialTotal / ITEMS_PER_PAGE),
    },
    searchQuery: '',
    filteredItems: initialItems,
});

const filterItems = <T extends { _id: string }>(
    items: T[],
    searchQuery: string,
    searchableFields: (keyof T)[]
) => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter((item) =>
        searchableFields.some((field) => {
            const value = item[field];
            return value && String(value).toLowerCase().includes(query);
        })
    );
};

export const useAdminStore = create<AdminStoreState>((set) => ({
    // Products
    products: createDataState<ProductShort>(),
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
            },
        })),
    setProductsLoading: (loading) =>
        set((state) => ({
            products: { ...state.products, loading },
        })),
    setProductsError: (error) =>
        set((state) => ({
            products: { ...state.products, error },
        })),
    searchProducts: (query) =>
        set((state) => ({
            products: {
                ...state.products,
                searchQuery: query,
                filteredItems: filterItems(state.products.items, query, ['name', 'sku'] as (keyof ProductShort)[]),
                pagination: {
                    ...state.products.pagination,
                    page: 1,
                },
            },
        })),
    setProductPage: (page) =>
        set((state) => ({
            products: {
                ...state.products,
                pagination: { ...state.products.pagination, page },
            },
        })),

    // Users
    users: createDataState<UserShort>(),
    setUsers: (items, total) =>
        set((state) => ({
            users: {
                ...state.users,
                items,
                filteredItems: items,
                pagination: {
                    page: 1,
                    limit: ITEMS_PER_PAGE,
                    total,
                    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
                },
            },
        })),
    setUsersLoading: (loading) =>
        set((state) => ({
            users: { ...state.users, loading },
        })),
    setUsersError: (error) =>
        set((state) => ({
            users: { ...state.users, error },
        })),
    searchUsers: (query) =>
        set((state) => ({
            users: {
                ...state.users,
                searchQuery: query,
                filteredItems: filterItems(state.users.items, query, ['email', 'username'] as (keyof UserShort)[]),
                pagination: {
                    ...state.users.pagination,
                    page: 1,
                },
            },
        })),
    setUserPage: (page) =>
        set((state) => ({
            users: {
                ...state.users,
                pagination: { ...state.users.pagination, page },
            },
        })),

    // Stock
    stock: createDataState<StokeShort>(),
    setStock: (items, total) =>
        set((state) => ({
            stock: {
                ...state.stock,
                items,
                filteredItems: items,
                pagination: {
                    page: 1,
                    limit: ITEMS_PER_PAGE,
                    total,
                    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
                },
            },
        })),
    setStockLoading: (loading) =>
        set((state) => ({
            stock: { ...state.stock, loading },
        })),
    setStockError: (error) =>
        set((state) => ({
            stock: { ...state.stock, error },
        })),
    searchStock: (query) =>
        set((state) => ({
            stock: {
                ...state.stock,
                searchQuery: query,
                filteredItems: filterItems(state.stock.items, query, ['batchNumber', 'productId'] as (keyof StokeShort)[]),
                pagination: {
                    ...state.stock.pagination,
                    page: 1,
                },
            },
        })),
    setStockPage: (page) =>
        set((state) => ({
            stock: {
                ...state.stock,
                pagination: { ...state.stock.pagination, page },
            },
        })),

    // Warehouses
    warehouses: createDataState<WarehouseShort>(),
    setWarehouses: (items, total) =>
        set((state) => ({
            warehouses: {
                ...state.warehouses,
                items,
                filteredItems: items,
                pagination: {
                    page: 1,
                    limit: ITEMS_PER_PAGE,
                    total,
                    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
                },
            },
        })),
    setWarehousesLoading: (loading) =>
        set((state) => ({
            warehouses: { ...state.warehouses, loading },
        })),
    setWarehousesError: (error) =>
        set((state) => ({
            warehouses: { ...state.warehouses, error },
        })),
    searchWarehouses: (query) =>
        set((state) => ({
            warehouses: {
                ...state.warehouses,
                searchQuery: query,
                filteredItems: filterItems(state.warehouses.items, query, ['name', 'code'] as (keyof WarehouseShort)[]),
                pagination: {
                    ...state.warehouses.pagination,
                    page: 1,
                },
            },
        })),
    setWarehousePage: (page) =>
        set((state) => ({
            warehouses: {
                ...state.warehouses,
                pagination: { ...state.warehouses.pagination, page },
            },
        })),

    // General
    limit: ITEMS_PER_PAGE,
}));
