import { CategoryAttribute, ICategory } from "@/types/dbData";
import mongoose, { Model, Schema } from "mongoose";


const attributesSchema = new Schema<CategoryAttribute>({
    name: {
        type: String,
        required: [true, 'Attribute name is required'],
        trim: true,
        maxlength: [100, 'Attribute name cannot exceed 100 characters']
    },
    type: {
        type: String,
        enum: {
            values: ['string', 'number', 'boolean', 'date'],
            message: 'Attribute type must be one of: string, number, boolean, date'
        },
        required: [true, 'Attribute type is required'],

    },
    unit: {
        type: String,
        trim: true,
        maxlength: [50, 'Attribute unit cannot exceed 50 characters'],
    },
    required: { type: Boolean, default: false },
},
    { _id: false } // Отключаем _id внутри схемы атрибута
);

// Основная схема категории
const categorySchema = new Schema<ICategory>({
    code: {
        type: String,
        required: [true, 'Category code is required'],
        unique: true,
        uppercase: true,
        trim: true,
        maxlength: [50, 'Category code cannot exceed 50 characters'],
        match: [/^[A-Z0-9_-]+$/, 'Category code can only contain uppercase letters, numbers, underscores, and hyphens']
    },
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Category description cannot exceed 500 characters']
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'Category',// рекурсивное связывание для иерархии категорий
        default: null
    },
    level: {
        type: Number,
        default: 1,
        required: true,
        min: [1, 'Category level must be at least 1']
    },
    attributes: {
        type: [attributesSchema],
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
},
    {
        timestamps: true, // Автоматическое управление полями createdAt и updatedAt
        toJSON: {
            virtuals: true,
            transform: (doc, ret: any) => { //eslint-disable-line
                ret.id = ret._id.toString(); // Добавляем поле id для удобства
                delete ret._id; // Удаляем _id, так как у нас есть id
                delete ret.__v; // Удаляем __v, так как мы не используем его
                return ret;
            },

        },// Включение виртуальных свойств
        toObject: { virtuals: true }
    }
);

categorySchema.virtual('parentName').get(function(this: ICategory & { parent?: { name: string } }) {
  return this.parent ? (this.parent as { name: string }).name : null;
});

const Category = (mongoose.models.Category as Model<ICategory>) || mongoose.model<ICategory>('Category', categorySchema);

export default Category;