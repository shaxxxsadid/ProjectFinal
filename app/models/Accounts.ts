import { Schema, model, models } from 'mongoose';

const accountsSchema = new Schema(
    {
        // 🔗 Связь 1:N: один пользователь → много записей аккаунтов
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'Users',
            required: true,
            index: true, // Быстрый поиск всех аккаунтов юзера
        },

        // 🔗 Связь N:1: один аккаунт → ровно один провайдер
        providerId: {
            type: Schema.Types.ObjectId,
            ref: 'Providers',
            required: true,
        },

        // 📋 Тип входа
        type: {
            type: String,
            required: true,
            enum: ['oauth', 'credential'],
        },

        // 🔑 ID у провайдера (для OAuth = ID из Google/GitHub, для credential = email или null)
        providerAccountId: {
            type: String,
        },

        // 🔐 OAuth-метаданные (только для type: 'oauth')
        accessToken: { type: String, select: false },
        refreshToken: { type: String, select: false },
        idToken: { type: String, select: false },
        expiresAt: { type: Date },
        scope: { type: String },

        //  Аватар от провайдера (опционально)
        avatar: { type: String },
    },
    { timestamps: true }
);

// 1. Уникальность: юзер не может дважды привязать один и тот же провайдер
accountsSchema.index({ userId: 1, providerId: 1 }, { unique: true });
// 2. Поиск OAuth-аккаунта при логине
accountsSchema.index({ providerId: 1, providerAccountId: 1 });

export const Accounts = models['Accounts'] || model('Accounts', accountsSchema, 'Accounts');