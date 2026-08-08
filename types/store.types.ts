
export interface RoleShort {
    _id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    priority: number;
    description?: string;
}



export interface AccountShort {
  _id: string;
  userId: string;
  type: 'oauth' | 'credential';
  
  // После .populate() providerId становится объектом, а не строкой
  providerId: {
    _id: string;
    name: string; // 'google', 'github', 'yandex', 'credentials'
  };
  
  // Перенесён на верхний уровень (как в новой схеме Mongoose)
  providerAccountId?: string; 
  
  avatar?: string;
  createdAt: string;
  updatedAt: string;
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


export interface StokeShort {
    _id: string;
    batchNumber: string;
    productId: string;
    warehouseId: string;
    quantity: number;
    available: number;
    reserved: number;
    createdAt: string;
    updatedAt: string;
    expiryDate?: string;
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
    type: string;
    managerId: string;
    phone: string;
    email: string;
    maxPallets: number;
    totalAreaSqm: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ProviderShort {
    _id: string;
    publicId: string;
    displayName: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
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
    createUser: (data: Omit<UserShort, '_id' | 'createdAt' | 'updatedAt'> & { password: string }) => Promise<{ success: boolean; error?: string; data?: UserShort }>;
    uploadAvatar: (userId: string | undefined, file: File) => Promise<void>;
    avatarVersions?: Record<string, number>;
    bumpAvatarVersion: (userId: string) => void;
    isLoading: boolean;
    error: string | null;
}

export interface RoleStoreState {
    roles: RoleShort[] | null;
    fetchRoles: () => Promise<void>;
    deleteRole: (roleId: string) => Promise<void>;
    createRole: (data: Omit<RoleShort, '_id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
    updateRole: (roleId: string, data: Partial<Omit<RoleShort, '_id' | 'createdAt' | 'updatedAt'>>) => Promise<{ success: boolean; error?: string }>;
    selectedRole: RoleShort | null;
    setSelectedRole: (role: RoleShort | null) => void;
    isLoading: boolean;
    error: string | null;
}

export interface BusinessProfileStoreState {
    businessProfiles: BusinessProfileShort[] | null;
    fetchBusinessProfiles: () => Promise<void>;
    updateBusinessProfile: (
        businessProfileId: string,
        data: Omit<BusinessProfileShort, '_id' | 'createdAt' | 'updatedAt'>
    ) => Promise<{ success: boolean; data?: BusinessProfileShort; error?: string }>;
    createBusinessProfile: (data: Omit<BusinessProfileShort, '_id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; data?: BusinessProfileShort; error?: string }>;
    deleteBusinessProfile: (businessProfileId: string) => Promise<void>;
    selectedBusinessProfile: BusinessProfileShort | null;
    setSelectedBusinessProfile: (profile: BusinessProfileShort | null) => void;
    isLoading: boolean;
    error: string | null;
}

export interface AccountStoreState {
    account: AccountShort[] | null;
    fetchAccount: () => Promise<void>;
    deleteAccount: (accountId: string) => Promise<void>;
    setSelectedAccount: (account: AccountShort | null) => void;
    selectedAccount: AccountShort | null;
    isLoading: boolean;
    error: string | null;
}

export interface ProviderStoreState {
    providers: ProviderShort[] | null;
    fetchProviders: () => Promise<void>;
    deleteProvider: (providerId: string) => Promise<void>;
    updateProvider: (providerId: string, data: Omit<ProviderShort, '_id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
    setSelectedProvider: (provider: ProviderShort | null) => void;
    createProvider: (data: Omit<ProviderShort, '_id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string; data?: ProviderShort }>;
    toggleActiveProvider: (providerId: string, active: boolean) => Promise<void>;
    selectedProvider: ProviderShort | null;
    isLoading: boolean;
    error: string | null;
}

export interface StokeStoreState {
    stock: StokeShort[] | null;
    fetchStock: () => Promise<void>;
    deleteStock: (stockId: string) => Promise<void>;
    updateStock: (stockId: string, data: Omit<StokeShort, '_id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
    setSelectedStock: (stock: StokeShort | null) => void;
    createStock: (data: Omit<StokeShort, '_id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string; data?: StokeShort }>;
    selectedStock: StokeShort | null;
    isLoading: boolean;
    error: string | null;
}

export interface WarehouseStoreState {
    warehouses: WarehouseShort[] | null;
    fetchWarehouses: () => Promise<void>;
    createWarehouse: (data: Omit<WarehouseShort, '_id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string; data?: WarehouseShort }>;
    deleteWarehouse: (warehouseId: string) => Promise<void>;
    updateWarehouse: (warehouseId: string, data: Omit<WarehouseShort, '_id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
    setSelectedWarehouse: (warehouse: WarehouseShort | null) => void;
    selectedWarehouse: WarehouseShort | null;
    isLoading: boolean;
    error: string | null;
}

// types/store.types.ts

export type ProductStorageType = 'сыпучие' | 'навал' | 'настольные' | 'контейнеры';
export type ProductPackagingUnit = 'шт' | 'кг' | 'м' | 'паллет';

export interface ProductPackaging {
    unit?: ProductPackagingUnit;
    quantityPerUnit?: number;
}

export interface ProductStorageConditions {
    temperatureMin?: number;
    temperatureMax?: number;
    humidityMax?: number;
}

export interface ProductCertification {
    name: string; // 'ISO9001' | 'CE' | 'IPPC' и т.д.
    value: boolean;
}

export interface ProductShort {
    _id: string;
    name: string;
    sku: string;
    categoryId: string;
    price?: number;

    // Физические характеристики
    length?: number;
    width?: number;
    height?: number;
    weight?: number;

    // Логистика
    loadCapacity?: number;
    volumeM3?: number;
    palletQuantity?: number;
    storageType?: ProductStorageType;
    packaging?: ProductPackaging;
    storageConditions?: ProductStorageConditions;

    // Отраслевые проверки
    isHeatTreated?: boolean;
    isIPPC_Certified?: boolean;
    expiryDate?: string;
    certifications?: ProductCertification[];

    avatar?: string; // на фронте всегда строка (base64 data URL), не Buffer
    createdAt?: string;
    updatedAt?: string;
}

// Пейлоад для create/update — без служебных полей
export type ProductInput = Omit<ProductShort, '_id' | 'createdAt' | 'updatedAt'>;

export interface ProductsPagination {
    page: number;
    limit: number;
    totalPages: number;
    total: number;
}

export interface ProductsState {
    items: ProductShort[];
    filteredItems: ProductShort[];
    pagination: ProductsPagination;
    searchQuery?: string;
    error: string | null;
}

export interface ProductStoreState {
    products: ProductsState;
    selectedProduct: ProductShort | null;
    isLoading: boolean;
    avatarVersions: Record<string, number>;

    setSelectedProduct: (product: ProductShort | null) => void;
    setProducts: (items: ProductShort[], total: number) => void;
    setProductsLoading: (loading: boolean) => void;
    setProductsError: (error: string | null) => void;
    searchProducts: (query: string) => void;
    setProductPage: (page: number) => void;

    fetchProducts: () => Promise<void>;
    fetchProductBySku: (sku: string) => Promise<ProductShort | null>;
    createProduct: (data: ProductInput) => Promise<{ success: boolean; error?: string; data?: ProductShort }>;
    updateProduct: (
        productId: string,
        data: Partial<ProductInput>
    ) => Promise<{ success: boolean; error?: string; data?: ProductShort }>;
    deleteProduct: (_id: string) => Promise<{ success: boolean; error?: string }>;
}