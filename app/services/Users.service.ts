import { IAvatar, IUser } from "@/types/dbData";
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
            return user as IUser;
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
        businessProfileId?: string
    }) {
        try {
            const newUser = await Users.create(userData);
            return newUser;
        } catch (error) {
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
        businessProfileId?: string
    }) {
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

    async getAvatar(email: string) {
        try {
            const user = await Users.findOne({ email });
            return user?.avatar;
        } catch (error) {
            logger.error(`Failed to fetch user avatar: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async updateUserAvatarById(_id: string, avatar: IAvatar) {
        try {
            const updatedUser = await Users.findByIdAndUpdate(
                _id,
                { avatar: avatar },
                {
                    returnDocument: 'after',  // ✅ Возвращает обновлённый документ
                    runValidators: true       // ✅ Прогоняет валидацию схемы
                }
            );
            return updatedUser;
        } catch (error) {
            logger.error(`Failed to update user avatar by id: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async updateUserAvatar(email: string, avatar: IAvatar) {
        try {
            const updatedUser = await Users.findOneAndUpdate(
                { email },
                { avatar: avatar },
                {
                    returnDocument: 'after',  // ✅ Вместо { new: true }
                    runValidators: true,
                    upsert: false
                }
            );
            return updatedUser;
        } catch (error) {
            logger.error(`Failed to update user avatar by email: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async updateUserPassword(email: string, passwordHash: string) {
        try {
            const updatedUser = await Users.findOneAndUpdate({ email }, { passwordHash }, { new: true });
            return updatedUser;
        } catch (error) {
            logger.error(`Failed to update user password: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async toggleUserActive(userId: string) {
        try {
            const user = await Users.findById(userId);
            if (!user) throw new Error('User not found');
            const updatedUser = await Users.findByIdAndUpdate(userId, { $set: { isActive: !user.isActive } }, { returnDocument: 'after' });
            return updatedUser;
        } catch (error) {
            logger.error(`Failed to toggle user active status: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }
}

export const usersService = new UsersService();