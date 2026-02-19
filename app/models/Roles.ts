import { Schema, model, models, connection } from 'mongoose';

interface IRoles {
    name: string;
    description: string;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
}

const RolesSchema = new Schema<IRoles>({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    priority: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export const Roles = models['Roles'] as any || model<IRoles>('Roles', RolesSchema, 'Roles');
