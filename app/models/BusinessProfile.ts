import { Schema, model, models } from 'mongoose';

type BusinessSType = 'individual' | 'company';
type BusinessStatus = 'active' | 'inactive';

interface IBusinessSProfile {
    type: BusinessSType;
    profileNumber: string;
    legalName: string;
    taxId: string;
    avatar: string | null;
    status: BusinessStatus;
    createdAt: Date;
    updatedAt: Date;
}

const BusinessProfileSchema = new Schema<IBusinessSProfile>({
    type: { type: String, enum: ['individual', 'company'], required: true },
    profileNumber: { type: String, required: true, unique: true },
    legalName: { type: String, required: true },
    taxId: { type: String, required: true },
    avatar: {
        type: String,
        required: false
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export const BusinessProfile = models['BusinessProfile'] || model<IBusinessSProfile>('BusinessProfile', BusinessProfileSchema, 'BusinessProfile');