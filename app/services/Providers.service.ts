import { logger } from "../lib/logger";
import { Providers } from "../models/Providers";

class ProvidersService {

    async getAllProviders() {
        try {
            const data = await Providers.find();
            return data;
        } catch (error) {
            logger.error(`Failed to fetch providers: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async getProviderByPublicId(publicId: string) {
        try {
            const provider = await Providers.findOne({ publicId });
            return provider;
        } catch (error) {
            logger.error(`Failed to fetch provider by publicId: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async createProvider(providerData: { publicId: string; name: string; displayName: string; isActive?: boolean;}) {
        try {
            const newProvider = await Providers.create(providerData);
            return newProvider;
        } catch (error) {
            logger.error(`Failed to create provider: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }
    async updateProvider(_id: string, name: string, updateData: { displayName?: string; isActive?: boolean }) {
        try {
            const updatedProvider = await Providers.findByIdAndUpdate(_id, { ...updateData, updatedAt: new Date() }, { new: true });
            return updatedProvider;
        } catch (error) {
            logger.error(`Failed to update provider: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async deleteProvider(_id: string) {
        try {
            const deletedProvider = await Providers.findByIdAndDelete(_id);
            return deletedProvider;
        } catch (error) {
            logger.error(`Failed to delete provider: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }
}

export const providersService = new ProvidersService();