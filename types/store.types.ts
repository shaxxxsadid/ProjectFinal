
export interface RoleShort {
    _id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    priority: number;
    description?: string;
}

export interface BusinessProfileShort {
    _id: string;
    legalName: string;
    profileNumber: string;
    type: string;
    taxId: string;
    avatar?: string | null; 
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
}

export interface ProductShort {
    _id: string;
    name: string;
    sku: string;
    weight: number;
    length: number;
    width: number;
    height: number;
    isIPPC_Certified: boolean;
    isHeatTreated: boolean;
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
    lastName?: string;
    firstName?: string;
    roleId?: string;
    businessProfileId?: string;
    createdAt: string;
    updatedAt: string;
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
    productIsLoading: boolean;
    products: DataListState<ProductShort>;
    setProducts: (items: ProductShort[], total: number) => void;
    setProductsLoading: (loading: boolean) => void;
    setProductsError: (error: string | null) => void;
    searchProducts: (query: string) => void;
    setProductPage: (page: number) => void;
    fetchProducts: (productId: ProductShort) => void;

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

export interface UserStoreState {
    // список загруженных пользователей (или null если не загружено)
    user: UserShort[] | null;
    fetchUser: () => Promise<void>;
    // выбранный пользователь (или null если не выбран)
    selectedUser: UserShort | null;
    // установить выбранного пользователя (или null)
    setSelectedUser: (user: UserShort | null) => void;
    // установить список пользователей
    setUser: (user: UserShort[] | null) => void;
    // переключить активность пользователя по ID
    toggleUserActive: (userId: string) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    updateUser: (userId: string, data: { username?: string; password?: string }) => Promise<{ success: boolean; error?: string }>;
    uploadAvatar: (userId: string | undefined, file: File) => Promise<void>;
    avatarVersions?: Record<string, number>;
    bumpAvatarVersion: (userId: string) => void;
    isLoading: boolean;
    error: string | null;
}

export interface RoleStoreState {
    roles: RoleShort[] | null;
    fetchRoles: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export interface BusinessProfileStoreState {
    businessProfiles: BusinessProfileShort[] | null;
    fetchBusinessProfiles: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

