import { Types } from 'mongoose';
import Category from '../models/Category';
import { Products } from '../models/Products';
import { logger } from '../lib/logger';

interface ProductPackagingInput {
    unit?: 'шт' | 'кг' | 'м' | 'паллет';
    quantityPerUnit?: number;
}

interface ProductStorageConditionsInput {
    temperatureMin?: number;
    temperatureMax?: number;
    humidityMax?: number;
}

interface ProductCertificationInput {
    name: string;
    value: boolean;
}

interface ProductCreateInput {
    sku: string;
    name: string;
    // Полный путь категорий: [Level 1, Level 2, ..., leaf]
    categoryId: string[];
    price: number;
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    loadCapacity?: number;
    volumeM3?: number;
    palletQuantity?: number;
    storageType?: 'сыпучие' | 'навал' | 'настольные' | 'контейнеры';
    packaging?: ProductPackagingInput;
    storageConditions?: ProductStorageConditionsInput;
    isHeatTreated?: boolean;
    isIPPC_Certified?: boolean;
    expiryDate?: string | Date;
    certifications?: ProductCertificationInput[];
    avatar?: {
        fileName: string;
        type: string;
        data: Buffer;
    };
}

interface ProductUpdateInput extends Partial<ProductCreateInput> {
    avatarUrl?: string;
}

export interface ProductServiceResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
}

class ProductService {
    /**
     * Frontend отправляет полный путь [L1, L2, ..., leaf].
     * На сервере мы берём leaf и заново строим путь по Category.parent.
     * Так в MongoDB всегда сохраняется корректный массив уровней.
     */
    private async buildCategoryPath(categoryValue: unknown): Promise<Types.ObjectId[]> {
        const values = (Array.isArray(categoryValue) ? categoryValue : [categoryValue])
            .map((value) => String(value ?? '').trim())
            .filter(Boolean);

        const leafId = values[values.length - 1];
        if (!leafId || !Types.ObjectId.isValid(leafId)) {
            throw new Error('Product category is required');
        }

        const path: Types.ObjectId[] = [];
        const visited = new Set<string>();
        let currentId: string | null = leafId;

        while (currentId) {
            if (visited.has(currentId)) {
                throw new Error('Category hierarchy contains a cycle');
            }
            visited.add(currentId);

            const category = await Category.findById(currentId)
                .select('_id parent')
                .lean() as { _id: Types.ObjectId; parent?: Types.ObjectId | null } | null;

            if (!category) {
                throw new Error(`Category not found: ${currentId}`);
            }

            path.unshift(new Types.ObjectId(String(category._id)));
            currentId = category.parent ? String(category.parent) : null;
        }

        return path;
    }

    /**
     * Для старых записей, где categoryId мог быть одиночным ID,
     * возвращаем на frontend полный путь, не изменяя БД во время GET.
     */
    private async normalizeProductForRead(product: any): Promise<any> { // eslint-disable-line
        try {
            const path = await this.buildCategoryPath(product.categoryId);
            product.categoryId = path;
        } catch (error) {
            logger.warn(
                `Failed to build category path for product ${String(product?._id ?? '')}: ${error instanceof Error ? error.message : error}`
            );
        }
        return product;
    }

    private async buildUpdatePayload(updateData: ProductUpdateInput): Promise<Record<string, unknown>> {
        const { categoryId, avatarUrl, ...rest } = updateData;
        const updatePayload: Record<string, unknown> = {
            ...rest,
            updatedAt: new Date(),
        };

        delete updatePayload._id;

        if (categoryId !== undefined) {
            updatePayload.categoryId = await this.buildCategoryPath(categoryId);
        }

        if (avatarUrl?.startsWith('data:image')) {
            const [header, base64Data] = avatarUrl.split(',');
            const mimeType = header?.match(/data:(.*?);base64/)?.[1] || 'image/png';
            const fileName = `product-${Date.now()}.${mimeType.split('/')[1]}`;

            updatePayload.avatar = {
                fileName,
                type: mimeType,
                data: Buffer.from(base64Data, 'base64'),
            };
        }

        return updatePayload;
    }

    async getAllProducts() {
        try {
            const data = await Products.find().select('-avatar.data');
            await Promise.all(data.map((product) => this.normalizeProductForRead(product)));
            return data;
        } catch (error) {
            logger.error(`Failed to fetch products: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async getProductBySku(sku: string): Promise<ProductServiceResult<any>> { // eslint-disable-line
        try {
            const product = await Products.findOne({ sku }).select('-avatar.data');
            if (!product) {
                return { success: false, error: 'Product not found', code: 'NOT_FOUND' };
            }

            await this.normalizeProductForRead(product);
            return { success: true, data: product };
        } catch (error) {
            logger.error(`Failed to fetch product by SKU ${sku}: ${error instanceof Error ? error.message : error}`);
            return { success: false, error: 'Failed to fetch product', code: 'GET_ERROR' };
        }
    }

    async createProduct(productData: ProductCreateInput) {
        try {
            const categoryPath = await this.buildCategoryPath(productData.categoryId);
            return await Products.create({
                ...productData,
                categoryId: categoryPath,
            });
        } catch (error) {
            logger.error(`Failed to create product: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async updateProduct(_id: string, updateData: ProductUpdateInput) {
        try {
            if (!Types.ObjectId.isValid(_id)) return null;

            const updatePayload = await this.buildUpdatePayload(updateData);
            return await Products.findByIdAndUpdate(
                _id,
                updatePayload,
                { new: true, runValidators: true }
            );
        } catch (error) {
            logger.error(`Failed to update product: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async updateProductBySku(
        sku: string,
        updateData: ProductUpdateInput
    ): Promise<ProductServiceResult<any>> { // eslint-disable-line
        try {
            const updatePayload = await this.buildUpdatePayload(updateData);
            const updatedProduct = await Products.findOneAndUpdate(
                { sku },
                updatePayload,
                { new: true, runValidators: true }
            ).select('-avatar.data');

            if (!updatedProduct) {
                return { success: false, error: 'Product not found', code: 'NOT_FOUND' };
            }

            return { success: true, data: updatedProduct };
        } catch (error) {
            logger.error(`Failed to update product by SKU ${sku}: ${error instanceof Error ? error.message : error}`);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update product',
                code: 'UPDATE_ERROR',
            };
        }
    }

    async deleteProduct(_id: string) {
        try {
            if (!Types.ObjectId.isValid(_id)) return null;
            return await Products.findByIdAndDelete(_id);
        } catch (error) {
            logger.error(`Failed to delete product: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async getAvatar(id: string) {
        try {
            if (!Types.ObjectId.isValid(id)) return null;
            const product = await Products.findById(id).select('avatar');
            return product?.avatar ?? null;
        } catch (error) {
            logger.error(`Failed to get product avatar: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async getById(id: string) {
        try {
            if (!Types.ObjectId.isValid(id)) return null;
            const product = await Products.findById(id).select('-avatar.data');
            if (!product) return null;

            await this.normalizeProductForRead(product);
            return product;
        } catch (error) {
            logger.error(`Failed to get product by id: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }
}

export const productService = new ProductService();
