import { logger } from "../lib/logger";
import { Warehouse } from "../models/Warehouse";

class WarehouseService {
    async getAllWarehouses() {
        try {
            return await Warehouse.find();
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }
    async getWarehouseByCode(code: string) {
        try {
            return await Warehouse.findOne({ code });
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }
    async createWarehouse(warehouseData: { code: string; name: string; location: string }) {
        try {
            return await Warehouse.create(warehouseData);
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    async updateWarehouse(_id: string, updateData: {
        code?: string;
        name?: string;
        type?: string;
        managerId?: string;
        phone?: string;
        email?: string;
        maxPallets?: number;
        totalAreaSqm?: number;
        isActive?: boolean;
    }) {
        try {
            const updatedWarehouse = await Warehouse.findByIdAndUpdate(_id, { ...updateData, updatedAt: new Date() }, { new: true });
            return updatedWarehouse;
        } catch (error) {
            logger.error(error);
            throw error;
        }
     }

    async deleteWarehouse(_id: string) {
        try {
            return await Warehouse.findByIdAndDelete(_id);
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }
}

export const warehouseService = new WarehouseService();