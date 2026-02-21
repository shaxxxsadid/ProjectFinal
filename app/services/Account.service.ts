import { Accounts } from "../models/Accounts";
import { logger } from "../lib/logger";

class AccountsService {
    async getAllAccounts() {
        try {
            const accounts = await Accounts.find();
            return accounts;
        } catch (error) {
            logger.error(`Failed to fetch accounts: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async getAccountById(_id: string) {
        try {
            const account = await Accounts.findById(_id);
            return account;
        } catch (error) {
            logger.error(`Failed to fetch account by id: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    /*
        Create required fields:
        - userId: string (reference to the user who owns the account) || null (if the account is created by provider)
        - BusinessProfileId: string (reference to the business profile associated with the account) || null (if the account is created by provider)
        - type: string (type of registration, oauth, credential, etc.)
        - providerId: string (reference to the provider who created the account)
        - avatar: string (URL to the avatar image associated with the account) || null (if not provided)
    */
    async createAccount(accountData: { userId?: string; businessProfileId?: string; type: string; providerId: string; avatar?: string }) {
        try {
            const newAccount = await Accounts.create(accountData);
            return newAccount;
        } catch (error) {
            logger.error(`Failed to create account: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async updateAccount(_id: string, updateData: { userId?: string; businessProfileId?: string; type?: string; providerId?: string; avatar?: string }) {
        try {
            const updatedAccount = await Accounts.findByIdAndUpdate(_id, { ...updateData, updatedAt: new Date() }, { new: true });
            return updatedAccount;
        } catch (error) {
            logger.error(`Failed to update account: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    async deleteAccount(_id: string) {
        try {
            const deletedAccount = await Accounts.findByIdAndDelete(_id);
            return deletedAccount;
        } catch (error) {
            logger.error(`Failed to delete account: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }
}

export const accountsService = new AccountsService();