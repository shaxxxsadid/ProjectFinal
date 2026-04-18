import {Schema, model, models} from 'mongoose';

interface IProviders {
    publicId: string;
    name: string;
    displayName: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ProvidersSchema = new Schema<IProviders>({
    publicId: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export const Providers = models['Providers'] || model<IProviders>('Providers', ProvidersSchema, 'Providers');