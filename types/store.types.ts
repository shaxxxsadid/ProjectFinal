


export interface RoleShort {
    _id: string;
    name: string;
}

export interface BusinessProfileShort {
    _id: string;
    legalName: string;
    type: string;
}

export interface ProductShort {
    _id: string;
    name: string;
    sku: string;
    categoryId: string;
    avatar?: string;
}

export interface StokeShort {
    _id: string;
    batchNumber: string;
    productId: string;
    quantity: number;
    available: number;
    reserved: number;
}

export interface UserShort {
    _id: string;
    email: string;
    username?: string;
    isActive: boolean;
}

export interface WarehouseShort {
    _id: string;
    name: string;
    code: string;
    isActive: boolean;
}

export interface ProviderShort {
    _id: string;
    name: string;
    displayName: string;
}

export interface PaginationState {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// ========== STORE STATES ==========
export interface DataListState<T> {
    items: T[];
    loading: boolean;
    error: string | null;
    pagination: PaginationState;
    searchQuery: string;
    filteredItems: T[];
}

export interface AdminStoreState {
    // Products
    products: DataListState<ProductShort>;
    setProducts: (items: ProductShort[], total: number) => void;
    setProductsLoading: (loading: boolean) => void;
    setProductsError: (error: string | null) => void;
    searchProducts: (query: string) => void;
    setProductPage: (page: number) => void;

    // Users
    users: DataListState<UserShort>;
    setUsers: (items: UserShort[], total: number) => void;
    setUsersLoading: (loading: boolean) => void;
    setUsersError: (error: string | null) => void;
    searchUsers: (query: string) => void;
    setUserPage: (page: number) => void;

    // Stock
    stock: DataListState<StokeShort>;
    setStock: (items: StokeShort[], total: number) => void;
    setStockLoading: (loading: boolean) => void;
    setStockError: (error: string | null) => void;
    searchStock: (query: string) => void;
    setStockPage: (page: number) => void;

    // Warehouses
    warehouses: DataListState<WarehouseShort>;
    setWarehouses: (items: WarehouseShort[], total: number) => void;
    setWarehousesLoading: (loading: boolean) => void;
    setWarehousesError: (error: string | null) => void;
    searchWarehouses: (query: string) => void;
    setWarehousePage: (page: number) => void;

    // General
    limit: number;
}