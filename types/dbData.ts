import { ObjectId } from "mongoose";

export interface IAvatar {
    fileName: string;
    type: string;
    data: Buffer;
}

// ========== ACCOUNTS ==========
export interface AccountDbPopulated {
  _id: ObjectId;
  userId: ObjectId;
  type: 'oauth' | 'credential';
  providerId: {
    _id: ObjectId;
    name: string;
  };
  providerAccountId?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUpdateAccount {
    _id?: ObjectId;
    userId?: ObjectId;
     type?: "oauth" | "credential | credential & oauth";
    providerId?: {
        id: ObjectId;
        providerAccountId: string;
        _id: ObjectId;
    };
    avatarUrl?: string;
}

export interface ICreateAccount {
    userId: ObjectId;
    type: "oauth" | "credential | credential & oauth";
    providerId?: {
        id: ObjectId;
        providerAccountId: string;
        _id: ObjectId;
    };
    avatarUrl?: string;
}

// ========== USERS ==========
export interface IUser {
    _id?: ObjectId;
    username?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: {
        fileName: string;
        type: string;
        data: Buffer;
    };
    passwordHash: string;
    roleId?: ObjectId;
    businessProfileId?: ObjectId;
    isActive: boolean;
    lastLogin?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUpdateUser {
    _id: ObjectId;
    username?: string;
    firstName?: string;
    lastName?: string;
    avatar?: {
        fileName?: string;
        type?: string;
        data?: Buffer;
    };
    passwordHash?: string;
    roleId?: ObjectId;
    businessProfileId?: ObjectId;
    isActive?: boolean;
    lastLogin?: Date;
}

export interface ICreateUser {
    username?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    passwordHash: string;
    roleId?: string;
    businessProfileId?: string;
}

// ========== BUSINESS PROFILE ==========
export interface IBusinessProfile {
    _id?: ObjectId;
    type: "individual" | "company";
    profileNumber: string;
    legalName: string;
    taxId: string;
    avatar: string | null;
    status: "active" | "inactive";
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUpdateBusinessProfile {
    _id: ObjectId;
    type?: "individual" | "company";
    profileNumber?: string;
    legalName?: string;
    taxId?: string;
    avatar?: string | null;
    status?: "active" | "inactive";
}

export interface ICreateBusinessProfile {
    type: "individual" | "company";
    profileNumber: string;
    legalName: string;
    taxId: string;
    avatar?: string | null;
    status?: "active" | "inactive";
}

// ========== PRODUCTS ==========
export interface IProduct {
    _id?: ObjectId;
    sku: string;
    name: string;
    categoryId: ObjectId;
    price: number;
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    loadCapacity?: number;
    isHeatTreated?: boolean;
    isIPPC_Certified?: boolean;
    avatar?: {
        fileName: string;
        type: string;
        data: Buffer;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUpdateProduct {
    _id: ObjectId;
    sku?: string;
    name?: string;
    categoryId?: ObjectId;
    price?: number;
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    loadCapacity?: number;
    isHeatTreated?: boolean;
    isIPPC_Certified?: boolean;
    avatar?: {
        fileName?: string;
        type?: string;
        data?: Buffer;
    };
}

export interface ICreateProduct {
    sku: string;
    name: string;
    categoryId: string;
    price: number;
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    loadCapacity?: number;
    isHeatTreated?: boolean;
    isIPPC_Certified?: boolean;
}

// ========== PROVIDERS ==========
export interface IProvider {
    _id?: ObjectId;
    publicId: string;
    name: string;
    displayName: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUpdateProvider {
    _id: ObjectId;
    publicId?: string;
    name?: string;
    displayName?: string;
    isActive?: boolean;
}

export interface ICreateProvider {
    publicId: string;
    name: string;
    displayName: string;
    isActive?: boolean;
}

// ========== ROLES ==========
export interface IRole {
    _id?: ObjectId;
    name: string;
    description: string;
    priority: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUpdateRole {
    _id: ObjectId;
    name?: string;
    description?: string;
    priority?: number;
}

export interface ICreateRole {
    name: string;
    description: string;
    priority: number;
}

// ========== STOCK ==========
export interface IStock {
    _id?: ObjectId;
    productId: string;
    warehouseId: string;
    quantity: number;
    reserved: number;
    available: number;
    batchNumber: string;
    expiryDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUpdateStock {
    _id: ObjectId;
    productId?: string;
    warehouseId?: string;
    quantity?: number;
    reserved?: number;
    available?: number;
    batchNumber?: string;
    expiryDate?: Date;
}

export interface ICreateStock {
    productId: string;
    warehouseId: string;
    quantity: number;
    reserved: number;
    available: number;
    batchNumber: string;
    expiryDate?: Date;
}

// ========== WAREHOUSE ==========
export interface IWarehouse {
    _id?: ObjectId;
    name: string;
    code: string;
    type: string;
    managerId: string;
    phone: string;
    email: string;
    maxPalettes: number;
    totalAreaSqm: number;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUpdateWarehouse {
    _id: ObjectId;
    name?: string;
    code?: string;
    type?: string;
    managerId?: string;
    phone?: string;
    email?: string;
    maxPalettes?: number;
    totalAreaSqm?: number;
    isActive?: boolean;
}

export interface ICreateWarehouse {
    name: string; // Название склада
    code: string;
    type: string;
    managerId: string;
    phone: string;
    email: string;
    maxPalettes: number;
    totalAreaSqm: number;
    isActive?: boolean;
}

// Строгие типы данных для атрибутов категории
export type AttributeDataType = 'number' | 'string' | 'boolean' | 'date'; 

export interface CategoryAttribute {
    name: string;                  // Название атрибута (например, "Гарантия")
    type: AttributeDataType;       // Строгий тип данных
    unit?: string;                 // Единица измерения (опционально: "мес", "кг", "см")
    required?: boolean;            // Обязательно ли заполнять это поле при создании товара (по умолчанию false)
}

export interface ICategory {
    _id?: ObjectId;
    code: string;                       // Уникальный код категории
    name: string;                       // Отображаемое имя
    description?: string;               // Описание категории
    parent: ObjectId | null;            // Для иерархии (подкатегории)
    level: number;                      // Уровень вложенности (0 для корневых категорий)
    attributes: CategoryAttribute[];    // Атрибуты для фильтрации и поиска товаров в категории
    isActive?: boolean;                 // Активна ли категория
    createdAt?: Date;
    updatedAt?: Date;
}
