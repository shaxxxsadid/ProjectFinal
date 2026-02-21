import { Schema, model, models } from 'mongoose';

interface IStoke {
    productId: string;
    warehouseId: string;
    quantity: number;
    reserved: number;
    available: number;
    batchNumber: string;
    createdAt: Date;
    updatedAt: Date;
    expiryDate: Date;
}

/* Stoke model definition
    - productId: string (reference to Product model)
    - warehouseId: string (reference to Warehouse model)
    - quantity: number (total quantity in stock)
    - reserved: number (quantity reserved for orders)
    - available: number (quantity available for new orders)
    - batchNumber: string (unique identifier for each batch)
    - createdAt: Date (automatically set)
    - updatedAt: Date (automatically set)
    - expiryDate: Date (optional)
*/
const StokeSchema = new Schema<IStoke>({
    productId: { type: String, required: true },
    warehouseId: { type: String, required: true },
    quantity: { type: Number, required: true },
    reserved: { type: Number, required: true },
    available: { type: Number, required: true },
    batchNumber: { type: String, unique: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now, required: true},
    expiryDate: { type: Date }
});

export const Stoke = models['Stoke'] || model<IStoke>('Stoke', StokeSchema, 'Stoke');