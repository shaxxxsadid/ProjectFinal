import { logger } from "../lib/logger";
import { Stoke } from "../models/Stoke";

class StokeService {
    async getAllStoke() {
        try {
            return await Stoke.find();
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }
    async getStokeByProductId(productId: string) {
        try {
            return await Stoke.findOne({ productId });
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    async getStokeByWarehouseId(warehouseId: string) {
        try {
            return await Stoke.find({ warehouseId });
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    async createStoke(stokeData: { 
        productId: string; 
        warehouseId: string; 
        quantity: number;
        reserved: number;
        available: number;
        batchNumber: string;
        expiryDate: Date }) {
        try {
            return await Stoke.create(stokeData);
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    async updateStoke(_id: string, updateData: { 
        productId?: string; 
        warehouseId?: string; 
        quantity?: number;
        reserved?: number;
        available?: number;
        batchNumber?: string;
        expiryDate?: Date }) {
        try {
            const updatedStoke = await Stoke.findByIdAndUpdate(_id, { ...updateData, updatedAt: new Date() }, { new: true });
            return updatedStoke;
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    async deleteStoke(_id: string) {
        try {
            return await Stoke.findByIdAndDelete(_id);
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }
}

export const stokeService = new StokeService();