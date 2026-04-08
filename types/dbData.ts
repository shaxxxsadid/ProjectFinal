import { Types } from "mongoose";

export interface IAvatar {
    fileName: string;
    type: string;
    data: Buffer;
}

// ========== ACCOUNTS ==========
export interface IAccount {
    _id?: Types.ObjectId;
    userId?: Types.ObjectId;
    type?: "oauth" | "credential | credential & oauth";
    providerId?: {
        id: Types.ObjectId;
        providerAccountId: string;
        _id: Types.ObjectId;
    };
    avatarUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUpdateAccount {
    _id?: Types.ObjectId;
    userId?: Types.ObjectId;
     type?: "oauth" | "credential | credential & oauth";
    providerId?: {
        id: Types.ObjectId;
        providerAccountId: string;
        _id: Types.ObjectId;
    };
    avatarUrl?: string;
}

export interface ICreateAccount {
    userId: Types.ObjectId;
    type: "oauth" | "credential | credential & oauth";
    providerId?: {
        id: Types.ObjectId;
        providerAccountId: string;
        _id: Types.ObjectId;
    };
    avatarUrl?: string;
}

// ========== USERS ==========
export interface IUser {
    _id?: Types.ObjectId;
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
    roleId?: Types.ObjectId;
    businessProfileId?: Types.ObjectId;
    isActive: boolean;
    lastLogin?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUpdateUser {
    _id: Types.ObjectId;
    username?: string;
    firstName?: string;
    lastName?: string;
    avatar?: {
        fileName?: string;
        type?: string;
        data?: Buffer;
    };
    passwordHash?: string;
    roleId?: Types.ObjectId;
    businessProfileId?: Types.ObjectId;
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
    _id?: Types.ObjectId;
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
    _id: Types.ObjectId;
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
    _id?: Types.ObjectId;
    sku: string;
    name: string;
    categoryId: Types.ObjectId;
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
    _id: Types.ObjectId;
    sku?: string;
    name?: string;
    categoryId?: Types.ObjectId;
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
    _id?: Types.ObjectId;
    publicId: string;
    name: string;
    displayName: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUpdateProvider {
    _id: Types.ObjectId;
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
    _id?: Types.ObjectId;
    name: string;
    description: string;
    priority: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUpdateRole {
    _id: Types.ObjectId;
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
    _id?: Types.ObjectId;
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
    _id: Types.ObjectId;
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
    _id?: Types.ObjectId;
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
    _id: Types.ObjectId;
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
    name: string;
    code: string;
    type: string;
    managerId: string;
    phone: string;
    email: string;
    maxPalettes: number;
    totalAreaSqm: number;
    isActive?: boolean;
}
