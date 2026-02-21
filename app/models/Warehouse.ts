import { Schema, model, models } from 'mongoose';
interface IWarehouse {
    name: string;
    code: string;
    type: string;
    managerId: string;
    phone: string;
    email: string;
    maxPalettes: number;
    totalAreaSqm: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/* Warehouse model definition
    - name: string (required)
    - code: string (required, unique)    
    - type: string (required)
    - managerId: ObjectId reference to User model
    - phone: string (required)
    - totalAreaSqm: number (required)
    - maxPallets: number (required)
    - isActive: boolean (default true)
    - createdAt: Date (automatically set)
    - updatedAt: Date (automatically set)
*/
const WarehouseSchema = new Schema<IWarehouse>({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    managerId: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    maxPalettes: { type: Number, required: true },
    totalAreaSqm: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export const Warehouse = models['Warehouse'] || model<IWarehouse>('Warehouse', WarehouseSchema, 'Warehouse');