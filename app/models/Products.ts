import { Schema, model, models } from 'mongoose';

/* Product model definition
    - sku: string (required, unique)
    - name: string (required)
    - categoryId: ObjectId reference to Category model
    - price: number (required)
    - length: number
    - width: number
    - height: number
    - weight: number
    - loadCapacity: number
    - isHeatTreated: boolean
    - isIPPC_Certified: boolean
    - createdAt: Date (automatically set)
    - updatedAt: Date (automatically set)
*/
const productSchema = new Schema({
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true },
    length: { type: Number },
    width: { type: Number },
    height: { type: Number },
    weight: { type: Number },    
    loadCapacity: { type: Number },
    isHeatTreated: { type: Boolean },    
    isIPPC_Certified: { type: Boolean },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export const Products = models['Products'] || model('Products', productSchema, 'Products');