// app/models/Products.ts
import { Schema, model, models } from 'mongoose';
/*
    Структура документа "Products" в MongoDB:
    {
        _id: ObjectId,
        sku: String,        // уникальное поле
        name: String,
        categoryId: ObjectId,
        price: Number,
        length: Number,
        width: Number,
        height: Number,
        weight: Number,     // в граммах
        loadCapacity: Number,
        volumeM3: Number,
        palletQuantity: Number,
        storageType: String,
        isHeatTreated: Boolean,
        isIPPC_Certified: Boolean,
        packaging: {
            unit: String,
            quantity: Number,
        }, 
        storageConditions: {
            temperatureMin: Number,
            temperatureMax: Number,
            humidityMin: Number,
            humidityMax: Number,
        },
        certifications: {
            CE: Boolean,
            ISO9001: Boolean,
            ISO14001: Boolean,
            ISO45001: Boolean,
        }  
        createdAt: Date,
        updatedAt: Date
    }
*/
 
const productSchema = new Schema({
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true },
 
    // Физические характеристики — плоские, совместимо с текущими документами
    length: { type: Number },
    width: { type: Number },
    height: { type: Number },
    weight: { type: Number },
 
    // Логистика
    loadCapacity: { type: Number },
    volumeM3: { type: Number },
    palletQuantity: { type: Number },
    storageType: {
        type: String,
        enum: ['сыпучие', 'навал', 'настольные', 'контейнеры'],
    },
    packaging: {
        unit: { type: String, enum: ['шт', 'кг', 'м', 'паллет'] },
        quantityPerUnit: { type: Number },
    },
    storageConditions: {
        temperatureMin: { type: Number },
        temperatureMax: { type: Number },
        humidityMax: { type: Number },
    },
 
    // Отраслевые проверки
    isHeatTreated: { type: Boolean },
    isIPPC_Certified: { type: Boolean },
    expiryDate: { type: Date, required: false },
    certifications: [
        {
            name: { type: String },
            value: { type: Boolean },
        },
    ],
 
    avatar: {
        fileName: { type: String },
        type: { type: String },
        data: { type: Buffer },
    },
 
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
 
productSchema.index({ categoryId: 1 });
productSchema.index({ isIPPC_Certified: 1 });
productSchema.index({ storageType: 1 });
productSchema.index({ expiryDate: 1 });
 
export const Products = models['Products'] || model('Products', productSchema, 'Products');