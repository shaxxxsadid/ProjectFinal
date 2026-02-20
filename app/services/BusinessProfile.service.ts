import { logger } from "../lib/logger";
import { BusinessProfile } from "../models/BusinessProfile";

class BusinessProfileService {
    async getAllBusinessProfiles() {
        try {
            const data = await BusinessProfile.find();
            if (!data) {
                logger.warn('No business profiles found');
                return [];
            }
            return data;
        } catch (error) {
            logger.error(`Failed to fetch business profiles: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async getBusinessProfileByTaxId(taxId: string) {
        try {
            const profile = await BusinessProfile.findOne({ taxId });
            if (!profile) {
                logger.warn(`Business profile with taxId ${taxId} not found`);
                return null;
            }
            return profile;
        } catch (error) {
            logger.error(`Failed to fetch business profile by taxId ${taxId}: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async createBusinessProfile(profileData: { type: string; profileNumber: string; legalName: string; taxId: string; avatar: string; status: string;}) {
        try {
            const newProfile = await BusinessProfile.create(profileData);
            return newProfile;
        } catch (error) {
            logger.error(`Failed to create business profile: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async updateBusinessProfile(_id: string, updateData: { type?: string; profileNumber?: string; legalName?: string; taxId?: string; avatar?: string; status?: string }) {
        try {
            const updatedProfile = await BusinessProfile.findByIdAndUpdate(_id, { ...updateData, updatedAt: new Date() }, { new: true });
            if (!updatedProfile) {
                logger.warn(`Business profile with _id ${_id} not found for update`);
                return null;
            }
            return updatedProfile;
        } catch (error) {
            logger.error(`Failed to update business profile: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async deleteBusinessProfile(_id: string) {
        try {
            const deletedProfile = await BusinessProfile.findByIdAndDelete(_id);
            return deletedProfile;
        } catch (error) {
            logger.error(`Failed to delete business profile: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }
}

export const businessProfileService = new BusinessProfileService();