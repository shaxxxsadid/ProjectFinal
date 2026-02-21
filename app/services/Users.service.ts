import { logger } from "../lib/logger";
import { Users } from "../models/Users";

class UsersService {
    async getAllUsers() {
        try {
            const users = await Users.find();
            return users;
        } catch (error) {
            logger.error(`Failed to fetch users: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async getUserByEmail(email: string) {
        try {
            const user = await Users.findOne({ email });
            return user;
        } catch (error) {            
            logger.error(`Failed to fetch user by email: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async createUser(userData: { 
        email: string; 
        passwordHash: string; 
        isActive: boolean; 
        username?: string; 
        firstName?: string; 
        lastName?: string; 
        roleId?: string; 
        businessProfileId?: string }) {
        try {
            const newUser = await Users.create(userData);
            return newUser;
        }catch (error) {
            logger.error(`Failed to create user: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async updateUser(_id: string, updateData: { 
        email?: string; 
        passwordHash?: string; 
        isActive?: boolean; 
        username?: string; 
        firstName?: string; 
        lastName?: string; 
        roleId?: string; 
        businessProfileId?: string }) {
        try {
            const updatedUser = await Users.findByIdAndUpdate(_id, { ...updateData, updatedAt: new Date() }, { new: true });
            return updatedUser;
        } catch (error) {
            logger.error(`Failed to update user: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async updateActiveStatus(_id: string, isActive: boolean) {
        try {
            const updatedUser = await Users.findByIdAndUpdate(_id, { isActive, updatedAt: new Date() }, { new: true });
            return updatedUser;
        } catch (error) {
            logger.error(`Failed to update user active status: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async deleteUser(_id: string) {
        try {
            const deletedUser = await Users.findByIdAndDelete(_id);
            return deletedUser;
        } catch (error) {
            logger.error(`Failed to delete user: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }
}

export const usersService = new UsersService();