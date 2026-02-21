import { Schema, model, models } from 'mongoose';

/* Accounts model definition
    - userId: ObjectId reference to User model
    - type: string (oauth, credential, etc.)
    - providerId: ObjectId reference to Provider model
    - avatar: string (URL to avatar image)
    - createdAt: Date (automatically set)
    - updatedAt: Date (automatically set)
*/
const accountsSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    type: { type: String, required: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
    avatar: { type: String }
}, { timestamps: true });

export const Accounts = models['Accounts'] || model('Accounts', accountsSchema, 'Accounts');