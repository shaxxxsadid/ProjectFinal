import { Products } from "../models/Products";
import { logger } from "../lib/logger";

class ProductService {
    async getAllProducts() {
        try {
            const data = await Products.find();
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
            const product = await Products.findOne({ sku });
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

    async createProduct(productData: { 
        sku: string; 
        name: string; 
        categoryId: string; 
        price: number; length?: 
        number; width?: number; 
        height?: number; 
        weight?: number; 
        loadCapacity?: number; 
        isHeatTreated?: boolean;
        avatar?: {
            fileName: string;
            type: string;
            data: Buffer;
        };
        isIPPC_Certified?: boolean }) {
        try {
            const newProduct = await Products.create(productData);
            return newProduct;
        } catch (error) {
            logger.error(`Failed to create product: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async updateProduct(_id: string, updateData: { 
        sku?: string; 
        name?: string;
        categoryId?: string;
        price?: number;
        length?: number;
        width?: number;
        height?: number;
        weight?: number;
        loadCapacity?: number;
        isHeatTreated?: boolean;
        isIPPC_Certified?: boolean; 
    }) {
        try {
            const updatedProduct = await Products.findByIdAndUpdate(_id, { ...updateData, updatedAt: new Date() }, { new: true });
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
}

export const productService = new ProductService();