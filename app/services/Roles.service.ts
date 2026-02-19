import { Roles } from "../models/Roles";
import { logger } from "../lib/logger";

class RolesService {
    async getAllRoles() {
        try {
            const data = await Roles.find();
            return data;
        } catch (error) {
            logger.error("Failed to fetch roles", error);
            throw error;
        }
    }

    async getRoleByName(name: string) {
        try {
            const role = await Roles.findOne({ name });
            return role;
        } catch (error) {
            logger.error("Failed to fetch role by name", error);
            throw error;
        }
    }

    async createRole(roleData: { name: string; description: string; priority: number }) {
        try {
            const newRole = await Roles.create(roleData);
            return newRole;
        } catch (error) {
            logger.error("Failed to create role", error instanceof Error ? error.message : error);
            throw error;
        }
    }

    async updateRole(_id: string, name: string, updateData: { description?: string; priority?: number }) {
        try {
            const updatedRole = await Roles.findByIdAndUpdate(_id, { ...updateData, updatedAt: new Date() }, { new: true });
            return updatedRole;
        } catch (error) {
            logger.error("Failed to update role", error instanceof Error ? error.message : error);
            throw error;
        }
    }

    async deleteRole(_id: string) {
        try {
            const deletedRole = await Roles.findByIdAndDelete(_id);
            return deletedRole;
        } catch (error) {
            logger.error("Failed to delete role", error instanceof Error ? error.message : error);
            throw error;
        }
    }
}

const rolesService = new RolesService();
export { rolesService };