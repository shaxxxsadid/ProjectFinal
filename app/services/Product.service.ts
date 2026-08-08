import { Products } from "../models/Products";
import { logger } from "../lib/logger";

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
    categoryId: string;
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
    avatarUrl?: string; // приходит с фронтенда как Base64 data URL
}

class ProductService {
    async getAllProducts() {
        try {
            // avatar.data исключаем из списка — иначе каждый GET /api/products
            // тянет все base64-картинки разом
            const data = await Products.find().select('-avatar.data');
            if (!data) {
                logger.warn('No products found');
                return [];
            }
            return data;
        } catch (error) {
            logger.error(`Failed to fetch products: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async getProductBySku(sku: string) {
        try {
            const product = await Products.findOne({ sku }).select('-avatar.data');
            if (!product) {
                logger.warn(`Product with SKU ${sku} not found`);
                return null;
            }
            return product;
        } catch (error) {
            logger.error(`Failed to fetch product by SKU ${sku}: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async createProduct(productData: ProductCreateInput) {
        try {
            const newProduct = await Products.create(productData);
            return newProduct;
        } catch (error) {
            logger.error(`Failed to create product: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async updateProduct(_id: string, updateData: ProductUpdateInput) {
        try {
            const updatePayload: Record<string, unknown> = {
                ...updateData,
                updatedAt: new Date(),
            };

            // Конвертируем Base64 в структуру avatar
            if (updateData.avatarUrl?.startsWith('data:image')) {
                const [header, base64Data] = updateData.avatarUrl.split(',');
                const mimeType = header?.match(/data:(.*?);base64/)?.[1] || 'image/png';
                const fileName = `product-${_id}-${Date.now()}.${mimeType.split('/')[1]}`;

                updatePayload.avatar = {
                    fileName,
                    type: mimeType,
                    data: Buffer.from(base64Data, 'base64'),
                };

                delete updatePayload.avatarUrl;
            }

            const updatedProduct = await Products.findByIdAndUpdate(_id, updatePayload, { new: true });

            if (!updatedProduct) {
                logger.warn(`Product with _id ${_id} not found for update`);
                return null;
            }

            return updatedProduct;
        } catch (error) {
            logger.error(`Failed to update product: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async deleteProduct(_id: string) {
        try {
            const deletedProduct = await Products.findByIdAndDelete(_id);
            return deletedProduct;
        } catch (error) {
            logger.error(`Failed to delete product: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async getAvatar(id: string) {
        try {
            const product = await Products.findById(id).select('avatar');
            if (!product) return null;
            return product.avatar;
        } catch (error) {
            logger.error(`Failed to get product avatar: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async getById(id: string) {
        try {
            const product = await Products.findById(id).select('-avatar.data');
            if (!product) return null;
            return product;
        } catch (error) {
            logger.error(`Failed to get product by id: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }
}

export const productService = new ProductService();