import { ProductShort, ProductInput, StokeShort, UserShort, WarehouseShort } from '@/types/store.types';
// UserShort, StokeShort, WarehouseShort — предполагается, что уже определены рядом в store.types.ts

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
    error: string | null;
}

export interface AdminStoreState {
    // Products
    productIsLoading: boolean;
    products: DataListState<ProductShort>;
    selectedProduct: ProductShort | null;
    avatarVersions: Record<string, number>;
    setSelectedProduct: (product: ProductShort | null) => void;
    setProducts: (items: ProductShort[], total: number) => void;
    setProductsLoading: (loading: boolean) => void;
    setProductsError: (error: string | null) => void;
    searchProducts: (query: string) => void;
    setProductPage: (page: number) => void;
    fetchProducts: () => Promise<void>;
    createProduct: (data: ProductInput) => Promise<{ success: boolean; error?: string; data?: ProductShort }>;
    updateProduct: (
        productId: string,
        data: Partial<ProductInput>
    ) => Promise<{ success: boolean; error?: string; data?: ProductShort }>;
    deleteProduct: (_id: string) => Promise<{ success: boolean; error?: string }>;

    // Users
    usersIsLoading: boolean;
    users: DataListState<UserShort>;
    setUsers: (items: UserShort[], total: number) => void;
    setUsersLoading: (loading: boolean) => void;
    setUsersError: (error: string | null) => void;
    searchUsers: (query: string) => void;
    setUserPage: (page: number) => void;
    fetchUsers: () => Promise<void>;

    // Stock
    stockIsLoading: boolean;
    stock: DataListState<StokeShort>;
    setStock: (items: StokeShort[], total: number) => void;
    setStockLoading: (loading: boolean) => void;
    setStockError: (error: string | null) => void;
    searchStock: (query: string) => void;
    setStockPage: (page: number) => void;
    fetchStock: () => Promise<void>;

    // Warehouses
    warehousesIsLoading: boolean;
    warehouses: DataListState<WarehouseShort>;
    setWarehouses: (items: WarehouseShort[], total: number) => void;
    setWarehousesLoading: (loading: boolean) => void;
    setWarehousesError: (error: string | null) => void;
    searchWarehouses: (query: string) => void;
    setWarehousePage: (page: number) => void;
    fetchWarehouses: () => Promise<void>;

    // General
    limit: number;
}